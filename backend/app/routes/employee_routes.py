from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.controllers.employee_controller import EmployeeController
from app.schemas.employee import EmployeeCreate, EmployeeUpdate

router = APIRouter()

@router.get("/employees", response_model=List[dict])
async def get_all_employees(
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """
    Get all employees with optional filters
    """
    employees = EmployeeController.get_all_employees()
    
    # Apply filters if provided
    if department:
        employees = [emp for emp in employees if emp.get("department") == department]
    if status:
        employees = [emp for emp in employees if emp.get("status") == status]
    
    return employees

@router.get("/employees/{employee_id}", response_model=dict)
async def get_employee(employee_id: int):
    """
    Get employee by ID
    """
    return EmployeeController.get_employee(employee_id)

@router.post("/employees", response_model=dict, status_code=201)
async def create_employee(employee: EmployeeCreate):
    """
    Create a new employee
    """
    return EmployeeController.create_employee(employee.dict())

@router.put("/employees/{employee_id}", response_model=dict)
async def update_employee(employee_id: int, employee: EmployeeUpdate):
    """
    Update an existing employee
    """
    # Remove None values
    update_data = {k: v for k, v in employee.dict().items() if v is not None}
    return EmployeeController.update_employee(employee_id, update_data)

@router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: int):
    """
    Delete an employee
    """
    return EmployeeController.delete_employee(employee_id)

@router.get("/stats/departments")
async def get_department_stats():
    """
    Get department statistics
    """
    return EmployeeController.get_department_stats()

@router.get("/stats/status")
async def get_status_stats():
    """
    Get status statistics
    """
    return EmployeeController.get_status_stats()