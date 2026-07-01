"""Defines request and response data for holiday."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# Defines the holiday base class.
class HolidayBase(BaseModel):
    """Base holiday payload."""
    name: str = Field(..., min_length=1, max_length=100)
    date: str = Field(..., min_length=10, max_length=20)
    description: Optional[str] = None
    holiday_type: str = Field(..., min_length=1, max_length=50)
    recurring: bool = False


# Defines the holiday create class.
class HolidayCreate(HolidayBase):
    """Create holiday payload."""


# Defines the holiday update class.
class HolidayUpdate(BaseModel):
    """Update holiday payload."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[str] = Field(None, min_length=10, max_length=20)
    description: Optional[str] = None
    holiday_type: Optional[str] = Field(None, min_length=1, max_length=50)
    recurring: Optional[bool] = None
    status: Optional[str] = None


# Defines the holiday response class.
class HolidayResponse(HolidayBase):
    """Holiday response."""
    id: int
    company_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    # Defines the config class.
    class Config:
        """Pydantic config."""
        from_attributes = True