"""Business logic. No FastAPI imports, no HTTP concepts.

The only thing this module does today is turn a request into a BirthMoment,
hand it to the pure engine, and map the result onto the wire schema. That
mapping is the point: it is what stops an internal dataclass change from
becoming a breaking API change.
"""

from __future__ import annotations

from datetime import datetime

from app.astrology_core import build_chart
from app.astrology_core.models import BirthMoment, Chart, Dasha, DashaPeriod, Planet
from app.core.errors import CalculationError
from app.modules.kundali.schemas import (
    AvakhadaOut,
    BirthDetailsIn,
    ChartOut,
    DashaOut,
    DashaPeriodOut,
    HouseOut,
    NakshatraOut,
    PanchangOut,
    PlanetOut,
    VargaChartOut,
)

DEFAULT_DASHA_DEPTH = 2
MAX_DASHA_DEPTH = 3


def generate_chart(details: BirthDetailsIn, dasha_depth: int = DEFAULT_DASHA_DEPTH) -> ChartOut:
    chart = build_chart(_birth_moment(details))
    return _to_schema(chart, dasha_depth=dasha_depth)


def _birth_moment(details: BirthDetailsIn) -> BirthMoment:
    hour, minute, *rest = details.time.split(":")
    second = int(rest[0]) if rest else 0
    try:
        local = datetime(
            details.date.year,
            details.date.month,
            details.date.day,
            int(hour),
            int(minute),
            second,
        )
    except ValueError as exc:
        raise CalculationError(f"Invalid birth time: {details.time}") from exc

    return BirthMoment(
        local_datetime=local,
        tz_name=details.tz_name,
        latitude=details.latitude,
        longitude=details.longitude,
        time_accuracy=details.time_accuracy,
    )


def _to_schema(chart: Chart, *, dasha_depth: int) -> ChartOut:
    return ChartOut(
        engine_version=chart.engine_version,
        computed_at=chart.computed_at,
        julian_day=chart.julian_day,
        ayanamsa_name=chart.ayanamsa_name,
        ayanamsa_value=chart.ayanamsa_value,
        lagna_sign=chart.lagna_sign,
        lagna_sign_index=chart.lagna_sign_index,
        lagna_degree=chart.lagna_degree,
        planets=[_planet(p) for p in chart.planets],
        houses=[
            HouseOut(
                number=h.number,
                sign=h.sign,
                sign_index=h.sign_index,
                lord=h.lord,
                occupants=list(h.occupants),
            )
            for h in chart.houses
        ],
        dasha=_dasha(chart.dasha, dasha_depth),
        # Two levels only for the secondary schemes: they are read for the
        # mahadasha and antardasha, and carrying a third would roughly triple
        # the payload for something nobody opens.
        tribhagi=_dasha(chart.tribhagi, min(dasha_depth, 2)),
        yogini=_dasha(chart.yogini, min(dasha_depth, 2)),
        panchang=PanchangOut.model_validate(chart.panchang, from_attributes=True),
        avakhada=AvakhadaOut.model_validate(chart.avakhada, from_attributes=True),
        vargas=[VargaChartOut.model_validate(v, from_attributes=True) for v in chart.vargas],
    )


def _dasha(tree: Dasha | None, depth: int) -> DashaOut | None:
    if tree is None:
        return None
    return DashaOut(
        birth_lord=tree.birth_lord,
        balance_years=tree.balance_years,
        periods=[_period(p, depth) for p in tree.periods],
    )


def _planet(p: Planet) -> PlanetOut:
    return PlanetOut(
        name=p.name,
        sign=p.sign,
        sign_index=p.sign_index,
        degree_in_sign=p.degree_in_sign,
        house=p.house,
        nakshatra=NakshatraOut(name=p.nakshatra.name, pada=p.nakshatra.pada, lord=p.nakshatra.lord),
        retrograde=p.retrograde,
        combust=p.combust,
        avastha=p.avastha,
        dignity=p.dignity,
        aspects_houses=list(p.aspects_houses),
    )


def _period(p: DashaPeriod, max_level: int) -> DashaPeriodOut:
    """Trimmed to `max_level`.

    The full three-level tree is 819 periods and 78KB of JSON; two levels is 90
    periods and 12KB. The timeline UI shows roughly twenty at a time, and the
    third level is only wanted when a user drills into one antardasha. Sending
    it by default costs every user 66KB on a phone connection for data almost
    none of them will look at.
    """
    return DashaPeriodOut(
        lord=p.lord,
        start=p.start,
        end=p.end,
        level=p.level,
        children=[_period(c, max_level) for c in p.children] if p.level < max_level else [],
    )
