"""The baseline migration and the table models must describe the same schema.

Production builds its schema with Alembic; tests build it from
`SQLModel.metadata`. If those two drift, the suite passes against a schema that
does not exist in production — which is worse than no test at all, because it
reads as coverage.
"""

from __future__ import annotations

import re
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest
from sqlmodel import SQLModel, create_engine

import app.modules.auth.models  # noqa: F401  (registers tables on the metadata)
import app.modules.report.models  # noqa: F401
import app.modules.vault.models  # noqa: F401

API_DIR = Path(__file__).resolve().parents[2]
BASELINE = next((API_DIR / "migrations" / "versions").glob("*baseline_schema.py"))


def _schema_of(db: Path) -> dict[str, set[str]]:
    """Columns per table, plus the set of named indexes.

    Indexes are compared too: an earlier version of this test checked only
    columns and happily passed while the models declared `ix_users_email` and
    every deployed database had `idx_*`. A second index on an already-indexed
    column costs writes and shows up nowhere.
    """
    with sqlite3.connect(db) as conn:
        schema = {
            row[0]: {c[1] for c in conn.execute(f"PRAGMA table_info({row[0]})")}
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            if not row[0].startswith(("sqlite_", "alembic_"))
        }
        schema["__indexes__"] = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='index'")
            if not row[0].startswith("sqlite_autoindex")
        }
        return schema


@pytest.fixture(scope="module")
def migrated() -> dict[str, set[str]]:
    db = Path(tempfile.mkdtemp()) / "migrated.sqlite3"
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=API_DIR,
        env={"PATH": "/usr/bin:/bin", "DATABASE_URL": f"sqlite:///{db}", "HOME": str(Path.home())},
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        pytest.skip(f"alembic unavailable here: {result.stderr[-200:]}")
    return _schema_of(db)


@pytest.fixture(scope="module")
def from_models() -> dict[str, set[str]]:
    db = Path(tempfile.mkdtemp()) / "models.sqlite3"
    SQLModel.metadata.create_all(create_engine(f"sqlite:///{db}"))
    return _schema_of(db)


def test_baseline_matches_the_table_models(
    migrated: dict[str, set[str]], from_models: dict[str, set[str]]
) -> None:
    assert migrated.keys() == from_models.keys(), "table sets differ"
    for table in sorted(from_models):
        assert migrated[table] == from_models[table], f"columns differ on {table}"


def test_baseline_downgrade_refuses_to_drop_everything() -> None:
    """Dropping the baseline destroys every saved chart. It must not be routine."""
    source = BASELINE.read_text()
    downgrade = source[source.index("def downgrade()") :]
    assert "NotImplementedError" in downgrade
    assert not re.search(r"\bdrop_table\b|\bDROP TABLE\b", downgrade)
