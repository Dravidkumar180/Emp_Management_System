from fastapi import APIRouter, HTTPException, Query, Request, Depends
from typing import List, Optional
from app.controllers.employee_controller import EmployeeController
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.utils.auth import get_current_active_user
from app.database.models import User

router = APIRouter()


@router.get("/employees", response_model=List[dict])
async def get_all_employees(
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all employees with optional filters
    """
    employees = EmployeeController.get_all_employees(current_user)
    
    # Apply filters if provided
    if department:
        employees = [emp for emp in employees if emp.get("department") == department]
    if status:
        employees = [emp for emp in employees if emp.get("status") == status]
    
    return employees


@router.get("/employees/{employee_id}", response_model=dict)
async def get_employee(
    employee_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get employee by ID
    """
    return EmployeeController.get_employee(employee_id, current_user)


@router.post("/employees", response_model=dict, status_code=201)
async def create_employee(
    employee: EmployeeCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new employee with audit logging
    """
    return EmployeeController.create_employee(
        employee.dict(), 
        request=request, 
        current_user=current_user
    )


@router.put("/employees/{employee_id}", response_model=dict)
async def update_employee(
    employee_id: int,
    employee: EmployeeUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an existing employee with audit logging
    """
    # Remove None values
    update_data = {k: v for k, v in employee.dict().items() if v is not None}
    return EmployeeController.update_employee(
        employee_id, 
        update_data, 
        request=request, 
        current_user=current_user
    )


@router.delete("/employees/{employee_id}")
async def delete_employee(
    employee_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an employee with audit logging
    """
    return EmployeeController.delete_employee(
        employee_id, 
        request=request, 
        current_user=current_user
    )


@router.get("/stats/departments")
async def get_department_stats(current_user: User = Depends(get_current_active_user)):
    """
    Get department statistics
    """
    return EmployeeController.get_department_stats(current_user)


@router.get("/stats/status")
async def get_status_stats(current_user: User = Depends(get_current_active_user)):
    """
    Get status statistics
    """
    return EmployeeController.get_status_stats(current_user)
