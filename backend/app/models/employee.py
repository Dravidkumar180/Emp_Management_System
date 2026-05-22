from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class Employee(BaseModel):
    """Employee Model"""
    id: int
    name: str
    email: str  # Changed from EmailStr to str temporarily
    username: str
    phone: str
    website: Optional[str] = None
    company: str
    department: str
    status: str
    role: str
    join_date: str
    location: str
    avatar: str
    
    @validator('email')
    def validate_email(cls, v):
        """Simple email validation"""
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        return v

class EmployeeCreate(BaseModel):
    """Model for creating a new employee"""
    name: str = Field(..., min_length=2, max_length=100)
    email: str  # Changed from EmailStr to str
    role: str
    department: str
    status: str = "Active"
    phone: Optional[str] = None
    location: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        return v

class EmployeeUpdate(BaseModel):
    """Model for updating an employee"""
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class EmployeeResponse(BaseModel):
    """Response model for employee operations"""
    success: bool
    message: str
    data: Optional[Employee] = None

class EmployeesListResponse(BaseModel):
    """Response model for employees list"""
    success: bool
    total: int
    data: list[Employee]