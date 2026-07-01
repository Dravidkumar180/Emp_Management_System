"""Defines request and response data for company."""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

# Defines the company base class.
class CompanyBase(BaseModel):
    """Groups company base helper functions."""
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    subscription_plan: str = "basic"

# Defines the company create class.
class CompanyCreate(CompanyBase):
    """Groups company create helper functions."""
    pass

# Defines the company update class.
class CompanyUpdate(BaseModel):
    """Groups company update helper functions."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    subscription_plan: Optional[str] = None
    is_active: Optional[bool] = None

# Defines the company response class.
class CompanyResponse(CompanyBase):
    """Groups company response helper functions."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Defines the config class.
    class Config:
        """Groups config helper functions."""
        from_attributes = True