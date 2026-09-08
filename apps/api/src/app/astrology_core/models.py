"""Frozen value objects. This is the contract the AI layer consumes.

Nothing here knows about the database or the API. `to_dict()` produces the
JSONB payload persisted on the `chart` table and handed to the LLM.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date, datetime
from typing import Any, Literal

Dignity = Literal[
    "exalted", "debilitated", "moolatrikona", "own",
    "friend", "neutral", "enemy",
]


@dataclass(frozen=True, slots=True)
class BirthMoment:
    """Everything needed to compute a chart. The only input."""

    local_datetime: datetime      # naive local wall-clock time at the birthplace
    tz_name: str                  # IANA zone, e.g. "Asia/Kathmandu". NEVER an offset.
    latitude: float               # degrees, north positive
    longitude: float              # degrees, EAST positive
    time_accuracy: Literal["exact", "approximate", "unknown"] = "exact"


@dataclass(frozen=True, slots=True)
class NakshatraPosition:
    index: int                    # 0-26
    name: str
    pada: int                     # 1-4
    lord: str                     # vimshottari dasha lord


@dataclass(frozen=True, slots=True)
class Planet:
    name: str
    longitude: float              # sidereal, 0-360
    sign_index: int               # 0-11
    sign: str
    degree_in_sign: float
    house: int                    # 1-12, whole-sign from lagna
    nakshatra: NakshatraPosition
    retrograde: bool
    combust: bool
    dignity: Dignity | None       # None for nodes: sources disagree
    speed: float                  # degrees/day; negative means retrograde
    avastha: str = ""             # Baladi avastha: Bala..Mrita
    aspects_houses: tuple[int, ...] = ()


@dataclass(frozen=True, slots=True)
class House:
    number: int                   # 1-12
    sign_index: int
    sign: str
    lord: str
    occupants: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class DashaPeriod:
    lord: str
    start: date
    end: date
    level: int                    # 1=maha, 2=antar, 3=pratyantar
    children: tuple[DashaPeriod, ...] = ()

    def active_at(self, when: date) -> DashaPeriod | None:
        """Deepest period containing `when`, or None if outside this period."""
        if not (self.start <= when < self.end):
            return None
        for child in self.children:
            found = child.active_at(when)
            if found is not None:
                return found
        return self


@dataclass(frozen=True, slots=True)
class Dasha:
    """Vimshottari tree plus the balance at birth."""

    birth_lord: str
    balance_years: float
    periods: tuple[DashaPeriod, ...] = ()

    def active_at(self, when: date) -> tuple[DashaPeriod, ...]:
        """Chain from mahadasha down to the deepest period covering `when`."""
        chain: list[DashaPeriod] = []
        nodes = self.periods
        while nodes:
            for node in nodes:
                if node.start <= when < node.end:
                    chain.append(node)
                    nodes = node.children
                    break
            else:
                break
        return tuple(chain)


@dataclass(frozen=True, slots=True)
class Chart:
    engine_version: str
    computed_at: datetime
    birth: BirthMoment
    julian_day: float
    ayanamsa_name: str
    ayanamsa_value: float
    lagna_sign_index: int
    lagna_sign: str
    lagna_degree: float
    planets: tuple[Planet, ...]
    houses: tuple[House, ...]
    dasha: Dasha
    panchang: Any
    avakhada: Any
    vargas: tuple[Any, ...] = field(default_factory=tuple)
    #: The same janma nakshatra run through two further schemes, read beside
    #: vimshottari rather than instead of it. Optional so nothing that builds
    #: a Chart without them breaks.
    tribhagi: Dasha | None = None
    yogini: Dasha | None = None
    #: Which siddhanta the positions come from. See `ephemeris.SIDDHANTA`.
    siddhanta: str = ""
    # Populated in Phase 1. Present now so the shape the AI consumes is stable.
    yogas: tuple[Any, ...] = field(default_factory=tuple)
    doshas: tuple[Any, ...] = field(default_factory=tuple)

    def planet(self, name: str) -> Planet:
        for p in self.planets:
            if p.name == name:
                return p
        raise KeyError(name)

    def to_dict(self) -> dict[str, Any]:
        """JSON-serialisable. Sorted-key dumping of this is the LLM's chart snapshot,
        so it must be byte-stable across turns or prompt caching breaks."""
        return _jsonable(asdict(self))


def _jsonable(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list | tuple):
        return [_jsonable(v) for v in value]
    if isinstance(value, datetime | date):
        return value.isoformat()
    return value
