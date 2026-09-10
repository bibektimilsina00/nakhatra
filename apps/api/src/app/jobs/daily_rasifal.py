"""Write tomorrow's rashifal, once.

Run from cron on the server:

    0 20 * * *  docker exec nakhatra_api uv run daily-rasifal

Twenty past eight in the evening UTC is a little after two in the morning in
Kathmandu, so the day is published before anyone wakes to read it. Running it
more than once is harmless: the table's unique constraint on (date, language)
means a second run finds the publication already there and does nothing.
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


def nepal_today() -> date:
    """Today in Kathmandu, never the server's idea of today.

    A box in UTC rolls over five and three-quarter hours late, which would
    publish the wrong day every evening.
    """
    return datetime.now(NEPAL).date()


async def run(on: date, languages: tuple[str, ...], overwrite: bool) -> int:
    """Publish `on` in each language. Returns the number of failures."""
    day = rasifal.compute(on)
    failures = 0
    with Session(get_engine()) as session:
        for language in languages:
            readings = await writer.generate(session, day, language, overwrite=overwrite)
            if readings:
                logger.info("%s/%s ready (%d signs)", on, language, len(readings))
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
        help="Nepal date as YYYY-MM-DD. Defaults to tomorrow, so the day is "
        "ready before anyone reads it.",
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

    on = date.fromisoformat(args.on) if args.on else nepal_today() + timedelta(days=1)
    languages = tuple(x.strip() for x in args.languages.split(",") if x.strip())

    failures = asyncio.run(run(on, languages, args.overwrite))
    # A non-zero exit is what makes cron mail the operator.
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
