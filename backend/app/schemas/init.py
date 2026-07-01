"""Defines request and response data for init."""
from app.schemas.employee import (
    EmployeeBase, EmployeeCreate, EmployeeUpdate, 
    EmployeeResponse, DepartmentBase, DepartmentResponse
)

__all__ = [
    "EmployeeBase", "EmployeeCreate", "EmployeeUpdate",
    "EmployeeResponse", "DepartmentBase", "DepartmentResponse"
]