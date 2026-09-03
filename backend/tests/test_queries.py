from datetime import date

from app.queries import month_bounds


def test_month_bounds_regular_month():
    assert month_bounds(8, 2026) == (date(2026, 8, 1), date(2026, 9, 1))


def test_month_bounds_january():
    assert month_bounds(1, 2026) == (date(2026, 1, 1), date(2026, 2, 1))


def test_month_bounds_december_rolls_into_next_year():
    assert month_bounds(12, 2026) == (date(2026, 12, 1), date(2027, 1, 1))
