"""What a session costs.

Isolated in its own module, with no database and no clock of its own, because
these are the rules a billing dispute turns on and they should be readable and
testable without standing anything up.

**The published rules.** Decide them once, say them plainly, never change them
quietly (docs/astrologer-marketplace.md §5.4):

- Billed **per second**, from connect to disconnect.
- With a **60-second minimum**. A one-word session still occupies the
  practitioner's attention and a slot in their day.
- Rounded **up** to the next whole second, never down, and never to the next
  whole minute — a five-second call charged a full minute is the thing that
  makes people stop trusting a meter.
- The rate is the one recorded on the consultation when it started, not the
  practitioner's current price.
"""

from __future__ import annotations

#: Below this, a session still costs a minute. Named, so the number appears
#: once and the reason travels with it.
MINIMUM_BILLED_SECONDS = 60

#: The ceiling a hold reserves when a wallet could fund a very long session.
#: Nobody consults for four hours, and reserving a whole balance against that
#: possibility makes the wallet look empty for no reason.
MAX_HELD_MINUTES = 60


def billed_seconds(elapsed_seconds: float) -> int:
    """Seconds to charge for, given how long the session actually ran."""
    if elapsed_seconds <= 0:
        # Connected and immediately gone, or never connected at all. Charging
        # a minimum here would bill for a session that did not happen.
        return 0
    return max(MINIMUM_BILLED_SECONDS, int(-(-elapsed_seconds // 1)))


def charge_minor(elapsed_seconds: float, rate_per_minute_minor: int) -> int:
    """What to capture, in minor units.

    Rounded up to the next minor unit: the alternative is charging fractions of
    a paisa, and the rounding has to go somewhere. Up by one paisa on a session
    is not worth a decision; down would let a long enough session cost nothing.
    """
    seconds = billed_seconds(elapsed_seconds)
    if seconds == 0 or rate_per_minute_minor <= 0:
        return 0
    total = seconds * rate_per_minute_minor
    return -(-total // 60)


def affordable_seconds(available_minor: int, rate_per_minute_minor: int) -> int:
    """How long this balance can pay for. Used for the warning, not the charge."""
    if rate_per_minute_minor <= 0:
        return 0
    return int(available_minor * 60 // rate_per_minute_minor)


def hold_amount_minor(available_minor: int, rate_per_minute_minor: int) -> int:
    """What to reserve when a session starts.

    The lesser of "everything they have" and "an hour of it". A hold is a
    ceiling on the session, and reserving more than any session could plausibly
    use just makes the rest of the wallet unusable while the call runs.
    """
    if rate_per_minute_minor <= 0:
        return 0
    ceiling = MAX_HELD_MINUTES * rate_per_minute_minor
    return min(available_minor, ceiling)
