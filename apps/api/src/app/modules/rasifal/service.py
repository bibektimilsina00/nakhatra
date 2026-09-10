"""The day's rasifal.

Thin by design: `astrology_core.rasifal` does the judging, this shapes it for
the wire. No astrology happens here.
"""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.astrology_core import rasifal
from app.modules.rasifal.schemas import RashiDayOut, RasifalOut, TransitOut

ENGINE_VERSION = "rasifal-1.0.0"

# The product's own zone. A "today" that follows the server's clock would flip
# a day early for Nepali readers whenever the box sits in UTC.
NEPAL = ZoneInfo("Asia/Kathmandu")


def today_in_nepal() -> date:
    return datetime.now(NEPAL).date()


def for_date(day: date) -> RasifalOut:
    computed = rasifal.compute(day)
    return RasifalOut(
        for_date=computed.for_date,
        weekday_lord=computed.weekday_lord,
        engine_version=ENGINE_VERSION,
        signs=[
            RashiDayOut(
                sign=s.sign,
                sign_index=s.sign_index,
                lord=s.lord,
                score=s.score,
                rating=s.rating,
                murti=s.murti,
                murti_house=s.murti_house,
                supports=s.supports,
                strains=s.strains,
                lucky_number=s.lucky_number,
                lucky_colour=s.lucky_colour,
                transits=[
                    TransitOut(
                        name=t.name,
                        sign=t.sign,
                        house=t.house,
                        favourable=t.favourable,
                        obstructed=t.obstructed,
                        retrograde=t.retrograde,
                    )
                    for t in s.transits
                ],
            )
            for s in computed.signs
        ],
    )
