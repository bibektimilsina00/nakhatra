"""Write tomorrow's rashifal, once.

Run from cron on the server:

    0 20 * * *  docker exec nakhatra_api uv run daily-rasifal

Eight in the evening UTC is a little after a quarter to two in Kathmandu, so
tomorrow is published before anyone wakes to read it. The run covers today as
well, which costs nothing when last night's run succeeded and repairs the day
when it did not. Running it more than once is harmless either way: the table's
unique constraint on (date, language) means a second pass finds the
publication already there and does nothing.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlmodel import Session

from app.astrology_core import rasifal
from app.core.db import get_engine
from app.modules.rasifal import writer

logger = logging.getLogger("daily_rasifal")

NEPAL = ZoneInfo("Asia/Kathmandu")
LANGUAGES = ("ne", "hi", "en")

#: Tries per day per language before giving up and letting cron mail someone.
ATTEMPTS = 2


def nepal_today() -> date:
    """Today in Kathmandu, never the server's idea of today.

    A box in UTC rolls over five and three-quarter hours late, which would
    publish the wrong day every evening.
    """
    return datetime.now(NEPAL).date()


async def run(dates: list[date], languages: tuple[str, ...], overwrite: bool) -> int:
    """Publish each date in each language. Returns the number of failures."""
    failures = 0
    with Session(get_engine()) as session:
        for on in dates:
            day = rasifal.compute(on)
            for language in languages:
                # A model that returns eleven signs or fences its JSON badly
                # loses the whole day, and the next run is a night away. One
                # retry costs a minute and turns most of those into nothing.
                for attempt in range(1, ATTEMPTS + 1):
                    readings = await writer.generate(
                        session, day, language, overwrite=overwrite
                    )
                    if readings:
                        logger.info("%s/%s ready (%d signs)", on, language, len(readings))
                        break
                    logger.warning(
                        "%s/%s attempt %d of %d produced nothing",
                        on, language, attempt, ATTEMPTS,
                    )
                else:
                    failures += 1
                    logger.error("%s/%s was not published", on, language)
    return failures


def main() -> int:
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )
    parser = argparse.ArgumentParser(description="Publish a day's rashifal.")
    parser.add_argument(
        "--on",
        default=None,
        help="Nepal date as YYYY-MM-DD. Publishes only that day. Without it "
        "the run covers today and tomorrow.",
    )
    parser.add_argument(
        "--languages",
        default=",".join(LANGUAGES),
        help="Comma-separated. Defaults to every language the site serves.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Rewrite a day that is already published. For repairing a bad "
        "publication, not for routine runs.",
    )
    args = parser.parse_args()

    if args.on:
        dates = [date.fromisoformat(args.on)]
    else:
        # Tomorrow is the point of the run; today is included so a missed
        # night repairs itself on the next one. It normally costs nothing —
        # today was published last night and the write is idempotent.
        today = nepal_today()
        dates = [today, today + timedelta(days=1)]
    languages = tuple(x.strip() for x in args.languages.split(",") if x.strip())

    failures = asyncio.run(run(dates, languages, args.overwrite))
    # A non-zero exit is what makes cron mail the operator.
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
