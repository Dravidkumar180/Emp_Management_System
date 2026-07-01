"""Defines API routes for holiday."""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Holiday, User
from app.schemas.holiday import HolidayCreate, HolidayUpdate
from app.utils.audit_helper import log_action
from app.utils.auth import get_admin_user, get_current_active_user, get_current_company_id

router = APIRouter()


# Runs serialize holiday.
def serialize_holiday(holiday: Holiday) -> dict:
    """Convert Holiday model to API response dict."""
    return {
        "id": holiday.id,
        "company_id": holiday.company_id,
        "name": holiday.name,
        "date": holiday.date,
        "description": holiday.description or "",
        "holiday_type": holiday.holiday_type,
        "recurring": holiday.recurring,
        "status": holiday.status,
        "created_at": holiday.created_at.isoformat() if holiday.created_at else None,
        "updated_at": holiday.updated_at.isoformat() if holiday.updated_at else None,
    }


# Gets holiday or 404 data.
def get_holiday_or_404(db: Session, holiday_id: int, company_id: int) -> Holiday:
    """Load a company-scoped holiday."""
    holiday = db.query(Holiday).filter(
        Holiday.id == holiday_id,
        Holiday.company_id == company_id,
        Holiday.status != "Deleted",
    ).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return holiday


# Helps with ensure unique date.
def ensure_unique_date(db: Session, company_id: int, date: str, holiday_id: int = None) -> None:
    """Prevent duplicate holidays on the same date for the same company."""
    query = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.date == date,
        Holiday.status != "Deleted",
    )
    if holiday_id is not None:
        query = query.filter(Holiday.id != holiday_id)
    if query.first():
        raise HTTPException(
            status_code=409,
            detail="A holiday already exists on this date for your company."
        )


@router.get("/holidays")
# Runs list holidays.
async def list_holidays(
    month: str = Query(None),
    year: str = Query(None),
    holiday_type: str = Query(None),
    search: str = Query(None),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """List holidays for the current user's company."""
    query = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.status != "Deleted",
    )
    if month:
        query = query.filter(Holiday.date.like(f"____-{month}-%"))
    if year:
        query = query.filter(Holiday.date.like(f"{year}-%"))
    if holiday_type:
        query = query.filter(Holiday.holiday_type == holiday_type)
    if search:
        query = query.filter(Holiday.name.ilike(f"%{search}%"))

    return [serialize_holiday(holiday) for holiday in query.order_by(Holiday.date.asc()).all()]


@router.get("/holidays/date/{date}")
# Gets holiday for date data.
async def get_holiday_for_date(
    date: str,
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Return the configured holiday for a date, including annual recurring matches."""
    month_day = date[5:10]
    holiday = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.status != "Deleted",
        (Holiday.date == date) | ((Holiday.recurring == True) & (Holiday.date.like(f"____-{month_day}"))),
    ).first()
    return serialize_holiday(holiday) if holiday else None


@router.post("/holidays", status_code=201)
# Creates holiday data.
async def create_holiday(
    holiday: HolidayCreate,
    request: Request,
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Create a company-scoped holiday."""
    ensure_unique_date(db, company_id, holiday.date)
    db_holiday = Holiday(
        company_id=company_id,
        name=holiday.name.strip(),
        date=holiday.date,
        description=(holiday.description or "").strip(),
        holiday_type=holiday.holiday_type,
        recurring=holiday.recurring,
        status="Active",
    )
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)

    log_action(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        action="Holiday Created",
        entity_type="holiday",
        entity_id=db_holiday.id,
        entity_name=db_holiday.name,
        details=f"Holiday {db_holiday.name} created for company {company_id} on {db_holiday.date}",
        request=request,
        new_value=str(serialize_holiday(db_holiday)),
        company_id=company_id,
    )
    return serialize_holiday(db_holiday)


@router.put("/holidays/{holiday_id}")
# Updates holiday data.
async def update_holiday(
    holiday_id: int,
    holiday_update: HolidayUpdate,
    request: Request,
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Update a company-scoped holiday."""
    db_holiday = get_holiday_or_404(db, holiday_id, company_id)
    update_data = holiday_update.model_dump(exclude_unset=True)
    if "date" in update_data:
        ensure_unique_date(db, company_id, update_data["date"], holiday_id)

    old_value = serialize_holiday(db_holiday)
    for field, value in update_data.items():
        if field == "name" and value is not None:
            value = value.strip()
        if field == "description" and value is not None:
            value = value.strip()
        setattr(db_holiday, field, value)

    db.commit()
    db.refresh(db_holiday)

    log_action(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        action="Holiday Updated",
        entity_type="holiday",
        entity_id=db_holiday.id,
        entity_name=db_holiday.name,
        details=f"Holiday {db_holiday.name} updated for company {company_id} on {db_holiday.date}",
        request=request,
        old_value=str(old_value),
        new_value=str(serialize_holiday(db_holiday)),
        company_id=company_id,
    )
    return serialize_holiday(db_holiday)


@router.delete("/holidays/{holiday_id}")
# Deletes holiday data.
async def delete_holiday(
    holiday_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Delete a company-scoped holiday."""
    db_holiday = get_holiday_or_404(db, holiday_id, company_id)
    old_value = serialize_holiday(db_holiday)
    db.delete(db_holiday)
    db.commit()

    log_action(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        action="Holiday Deleted",
        entity_type="holiday",
        entity_id=holiday_id,
        entity_name=old_value["name"],
        details=f"Holiday {old_value['name']} deleted for company {company_id} on {old_value['date']}",
        request=request,
        old_value=str(old_value),
        company_id=company_id,
    )
    return {"message": "Holiday deleted successfully"}