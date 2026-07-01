"""Defines request and response data for employee."""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

# Defines the employee base class.
class EmployeeBase(BaseModel):
    """Base Employee Schema"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    username: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    company: Optional[str] = None
    department: str
    status: str = "Active"
    role: str
    location: Optional[str] = None
    join_date: Optional[str] = None
    avatar: Optional[str] = None

# Defines the employee create class.
class EmployeeCreate(EmployeeBase):
    """Schema for creating employee"""
    
    @field_validator('name')
    @classmethod
    # Helps with validate name.
    def validate_name(cls, v):
        """Runs validate name logic."""
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @field_validator('email')
    @classmethod
    # Helps with validate email.
    def validate_email(cls, v):
        """Runs validate email logic."""
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v

# Defines the employee update class.
class EmployeeUpdate(BaseModel):
    """Schema for updating employee"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    join_date: Optional[str] = None

# Defines the employee response class.
class EmployeeResponse(EmployeeBase):
    """Schema for employee response"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Defines the config class.
    class Config:
        """Groups config helper functions."""
        from_attributes = True

# Defines the department base class.
class DepartmentBase(BaseModel):
    """Department Schema"""
    name: str
    description: Optional[str] = None

# Defines the department response class.
class DepartmentResponse(DepartmentBase):
    """Department Response Schema"""
    id: int
    created_at: datetime
    
    # Defines the config class.
    class Config:
        """Groups config helper functions."""
        from_attributes = True