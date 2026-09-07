"""Read-only queries against the GeoNames index.

Its own SQLite file rather than the application database: it is derived data,
rebuilt wholesale by `scripts/build_places.py`, and nothing writes to it at
runtime. Putting it in Postgres would mean a 117MB migration for data that a
script can regenerate in two minutes.
"""

from __future__ import annotations

import logging
import sqlite3
import unicodedata
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[4] / "data" / "places.sqlite3"

log = logging.getLogger(__name__)

_connection: sqlite3.Connection | None = None


class PlaceIndexMissing(RuntimeError):
    pass


def _connect() -> sqlite3.Connection:
    global _connection
    if _connection is None:
        if not DB_PATH.exists():
            raise PlaceIndexMissing(
                f"place index not found at {DB_PATH}. "
                "Build it with: uv run python scripts/build_places.py"
            )
        # check_same_thread=False: the connection is read-only and shared across
        # the thread pool FastAPI runs sync handlers on.
        _connection = sqlite3.connect(DB_PATH, check_same_thread=False)
        _connection.row_factory = sqlite3.Row
        ensure_fuzzy_index(_connection)
    return _connection


def normalise(text: str) -> str:
    """Match the fold used when the index was built, so 'pokhara' finds 'Pokharā'."""
    folded = unicodedata.normalize("NFKD", text)
    return "".join(c for c in folded if not unicodedata.combining(c)).lower().strip()


# ── spelling tolerance ──────────────────────────────────────────────────
#
# A trigram index over the alias terms of places anyone is plausibly born in.
# Restricted to population >= 1000 because it exists to catch typos in city
# names: including all 786k rows would triple the index for hamlets nobody
# misspells, and would bury the real answer under near-identical noise.

FUZZY_MIN_POPULATION = 1000

FUZZY_DDL = """
CREATE VIRTUAL TABLE fuzzy USING fts5(term, tokenize='trigram');
INSERT INTO fuzzy(term)
  SELECT DISTINCT a.term FROM alias a JOIN place p ON p.id = a.place_id
   WHERE p.population >= :pop;
"""


def ensure_fuzzy_index(db: sqlite3.Connection) -> None:
    """Build the trigram index once, if this index file predates it.

    Takes about two seconds and adds ~25MB. Doing it here rather than only in
    the build script means an existing index file keeps working after an
    upgrade instead of silently losing spelling tolerance.
    """
    exists = db.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'fuzzy'"
    ).fetchone()
    if exists:
        return
    log.info("building the place spelling index (one time, ~2s)")
    db.executescript(FUZZY_DDL.replace(":pop", str(FUZZY_MIN_POPULATION)))
    db.commit()


def _edit_distance(a: str, b: str, cap: int) -> int:
    """Levenshtein, abandoned as soon as it cannot come in at or under `cap`."""
    if abs(len(a) - len(b)) > cap:
        return cap + 1
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        best = i
        for j, cb in enumerate(b, 1):
            current.append(min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (ca != cb)))
            best = min(best, current[-1])
        if best > cap:
            return cap + 1
        previous = current
    return previous[-1]


def _tolerance(length: int) -> int:
    """How wrong a spelling may be before it stops being the same word."""
    if length <= 4:
        return 1
    if length <= 8:
        return 2
    return 3


# Ranking, in both queries: an exact name match first, then the largest place —
# typing "delhi" should surface Delhi, not a hamlet whose alias starts with it.
_PREFIX_SQL = """
WITH hit AS (
  SELECT a.place_id AS pid,
         MIN(LENGTH(a.term)) AS best_len,
         MAX(a.term = ?) AS exact,
         -- Length packed in front of the term so MIN() picks the shortest
         -- matching alias in the pass the grouping already makes. Resolving it
         -- with a correlated subquery instead cost 2.5s on a two-letter query,
         -- because it ran once per group rather than once per returned row.
         MIN(SUBSTR('00000' || LENGTH(a.term), -5) || a.term) AS packed
  FROM alias a
  WHERE a.term >= ? AND a.term < ?
  GROUP BY a.place_id
)
SELECT p.*, hit.best_len, hit.exact, SUBSTR(hit.packed, 6) AS matched_term
FROM hit JOIN place p ON p.id = hit.pid
ORDER BY hit.exact DESC, p.population DESC, hit.best_len ASC, p.name ASC
LIMIT ?
"""

_BY_TERMS_SQL = """
SELECT DISTINCT p.*, a.term AS matched_term
FROM alias a JOIN place p ON p.id = a.place_id
WHERE a.term IN ({placeholders})
"""

# The high mark of the alias range: a prefix scan runs to the first term the
# prefix cannot start.
_RANGE_END = "\uffff"


def _prefix_search(db: sqlite3.Connection, term: str, limit: int) -> list[sqlite3.Row]:
    return db.execute(_PREFIX_SQL, (term, term, term + _RANGE_END, limit)).fetchall()


def _fuzzy_search(db: sqlite3.Connection, term: str, limit: int) -> list[sqlite3.Row]:
    """Places whose spelling is close to `term`, best guess first."""
    trigrams = [term[i : i + 3] for i in range(len(term) - 2)]
    if not trigrams:
        return []

    # OR the trigrams rather than matching the phrase: a phrase match is a
    # substring search, which by definition cannot survive a typo.
    match = " OR ".join(f'"{t}"' for t in trigrams)
    try:
        candidates = db.execute(
            "SELECT term FROM fuzzy WHERE fuzzy MATCH ? ORDER BY rank LIMIT 600",
            (match,),
        ).fetchall()
    except sqlite3.OperationalError:
        return []  # no trigram index on this file; prefix results stand alone

    cap = _tolerance(len(term))
    near = sorted(
        (d, row["term"])
        for row in candidates
        # Budget the tolerance against the shorter of the two: two edits away
        # from a nine-letter city is a typo, but two edits away from a
        # three-letter alias is a different word.
        if (d := _edit_distance(term, row["term"], cap))
        <= _tolerance(min(len(term), len(row["term"])))
    )[:60]
    if not near:
        return []

    distance = {t: d for d, t in near}
    rows = db.execute(
        _BY_TERMS_SQL.format(placeholders=",".join("?" * len(distance))),
        list(distance),
    ).fetchall()

    # Closest spelling first, then the place someone most likely meant.
    return sorted(rows, key=lambda r: (distance[r["matched_term"]], -r["population"]))[:limit]


def search(query: str, limit: int = 20) -> list[sqlite3.Row]:
    term = normalise(query)
    if len(term) < 2:
        return []

    db = _connect()
    rows = _prefix_search(db, term, limit)
    if len(rows) >= limit:
        return rows

    # Only once the prefix has run dry, so a correct spelling never pays for
    # spelling tolerance.
    seen = {row["id"] for row in rows}
    for row in _fuzzy_search(db, term, limit - len(rows)):
        if row["id"] not in seen:
            seen.add(row["id"])
            rows.append(row)
    return rows


def count() -> int:
    return _connect().execute("SELECT COUNT(*) FROM place").fetchone()[0]
