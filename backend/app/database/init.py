"""Database setup files for the backend."""
from app.database.mock_data import (
    mock_employees, 
    get_employees, 
    get_employee_by_id,
    add_employee,
    update_employee,
    delete_employee
)

__all__ = [
    "mock_employees", 
    "get_employees", 
    "get_employee_by_id",
    "add_employee",
    "update_employee",
    "delete_employee"
]