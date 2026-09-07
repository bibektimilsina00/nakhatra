"""The published billing rules, tested without a database.

These are the numbers a dispute turns on, so they are worth pinning exactly:
per second, 60-second minimum, rounded up, never down.
"""

from __future__ import annotations

import pytest

from app.modules.consultations import metering

RATE = 2_500  # NPR 25.00 per minute, in paisa


@pytest.mark.parametrize(
    "elapsed,expected",
    [
        (0, 0),
        (-1, 0),
        (0.5, 60),
        (1, 60),
        (59, 60),
        (60, 60),
        (60.1, 61),
        (90, 90),
        (600, 600),
    ],
)
def test_billed_seconds(elapsed: float, expected: int) -> None:
    assert metering.billed_seconds(elapsed) == expected


def test_a_session_that_never_connected_costs_nothing() -> None:
    """Zero elapsed must not attract the minimum. Nothing happened."""
    assert metering.charge_minor(0, RATE) == 0


def test_a_five_second_session_costs_the_minimum_and_no_more() -> None:
    assert metering.charge_minor(5, RATE) == RATE


def test_ninety_seconds_costs_a_minute_and_a_half() -> None:
    """Not two minutes. Rounding a partial minute up is what makes a meter
    feel dishonest."""
    assert metering.charge_minor(90, RATE) == RATE + RATE // 2


def test_rounding_goes_up_by_at_most_one_minor_unit() -> None:
    """A rate that does not divide evenly still cannot be free."""
    charge = metering.charge_minor(1, 7)
    assert charge == 7
    charge = metering.charge_minor(61, 7)
    assert charge == -(-(61 * 7) // 60)


def test_a_hold_never_exceeds_an_hour_of_talking() -> None:
    """Reserving a whole large balance makes the rest of it unusable."""
    hour = metering.MAX_HELD_MINUTES * RATE
    assert metering.hold_amount_minor(10_000_000, RATE) == hour


def test_a_hold_never_exceeds_the_balance() -> None:
    assert metering.hold_amount_minor(4_000, RATE) == 4_000


def test_affordable_seconds_is_what_the_warning_counts_down() -> None:
    assert metering.affordable_seconds(RATE, RATE) == 60
    assert metering.affordable_seconds(RATE // 2, RATE) == 30
    assert metering.affordable_seconds(0, RATE) == 0
