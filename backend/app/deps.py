from datetime import date

from fastapi import HTTPException, Query

from app.queries import month_bounds


def period(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000),
) -> tuple[date, date] | None:
    if month and year:
        return month_bounds(month, year)
    if month or year:
        raise HTTPException(status_code=422, detail="month e year precisam vir juntos")
    return None
