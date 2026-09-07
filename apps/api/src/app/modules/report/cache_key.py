"""What makes two readings the same reading.

Getting this wrong is worse than not caching at all: too loose and someone reads
a stranger's chart, too tight and nothing ever hits.

Everything the prompt is given about the person goes in, because anything the
model can see it can write about:

- **date, time, accuracy** — the moment itself.
- **latitude and longitude**, which is the one people get wrong by keying on the
  Julian day alone. Two births at the same instant in Kathmandu and in London
  share a Julian day and have different ascendants; serving one's reading for
  the other would be a different chart entirely.
- **tz_name**, not an offset (CLAUDE.md rule 5).
- **name**, because it is in the prompt and the model addresses the reader by
  it. A cached reading under someone else's name reads as an obvious mistake.
- **engine_version**, because a bumped engine can move positions, and a reading
  describing the old ones is stale rather than merely old (CLAUDE.md rule 4).

Language is deliberately absent — it is its own column, so the three languages
sit next to each other under one key rather than hashing to unrelated buckets.
"""

from __future__ import annotations

import hashlib
import json

from app.modules.kundali.schemas import BirthDetailsIn


def chart_key(birth: BirthDetailsIn, engine_version: str) -> str:
    payload = {
        "engine_version": engine_version,
        "name": birth.name.strip(),
        "date": str(birth.date),
        "time": str(birth.time),
        "time_accuracy": str(birth.time_accuracy),
        # Rounded to ~1cm. Float noise from a geocoder must not create a new
        # key for what is plainly the same birthplace.
        "latitude": round(birth.latitude, 7),
        "longitude": round(birth.longitude, 7),
        "tz_name": birth.tz_name,
    }
    # `sort_keys` so the digest does not depend on dict ordering, which is an
    # implementation detail that has changed between Python versions before.
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()
