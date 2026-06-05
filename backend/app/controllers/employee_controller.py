from typing import List, Dict
from fastapi import HTTPException, Request
from app.services.employee_service import EmployeeService
from app.utils.audit_helper import log_action
from app.database.models import User


class EmployeeController:
    """Controller layer for employee operations"""
    
    @staticmethod
    def get_all_employees(current_user: User) -> List[Dict]:
        """Get all employees"""
        employees = EmployeeService.get_all_employees(current_user.company_id)
        if not employees:
            raise HTTPException(status_code=404, detail="No employees found")
        return employees
    
    @staticmethod
    def get_employee(employee_id: int, current_user: User) -> Dict:
        """Get employee by ID"""
        employee = EmployeeService.get_employee_by_id(employee_id, current_user.company_id)
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found")
        return employee
    
    @staticmethod
    def create_employee(employee_data: Dict, request: Request = None, current_user: User = None) -> Dict:
        """Create new employee with audit log"""
        if not employee_data.get("name") or not employee_data.get("email"):
            raise HTTPException(status_code=400, detail="Name and email are required")
        
        # Create the employee
        new_employee = EmployeeService.create_employee(employee_data, current_user.company_id)
        
        # Log the action (if request and current_user are provided)
        if request and current_user:
            log_action(
                user_id=current_user.id,
                user_name=current_user.name,
                user_email=current_user.email,
                action="Employee Created",
                entity_type="employee",
                entity_id=new_employee.get("id"),
                entity_name=new_employee.get("name"),
                details=f"Employee {new_employee.get('name')} was created",
                request=request,
                company_id=current_user.company_id
            )
        
        return new_employee
    
    @staticmethod
    def update_employee(employee_id: int, update_data: Dict, request: Request = None, current_user: User = None) -> Dict:
        """Update employee with audit log"""
        # Get old employee data for audit
        old_employee = EmployeeService.get_employee_by_id(employee_id, current_user.company_id)
        
        # Update the employee
        employee = EmployeeService.update_employee(employee_id, update_data, current_user.company_id)
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found")
        
        # Log the action (if request and current_user are provided)
        if request and current_user and old_employee:
            # Track what changed
            changes = []
            for key, new_value in update_data.items():
                if key in old_employee and old_employee[key] != new_value:
                    changes.append(f"{key}: '{old_employee[key]}' → '{new_value}'")
            
            details = f"Employee {employee.get('name')} was updated"
            if changes:
                details += f" | Changes: {', '.join(changes)}"
            
            log_action(
                user_id=current_user.id,
                user_name=current_user.name,
                user_email=current_user.email,
                action="Employee Updated",
                entity_type="employee",
                entity_id=employee_id,
                entity_name=employee.get("name"),
                details=details,
                request=request,
                old_value=str(old_employee) if changes else None,
                new_value=str(update_data) if changes else None,
                company_id=current_user.company_id
            )
        
        return employee
    
    @staticmethod
    def delete_employee(employee_id: int, request: Request = None, current_user: User = None) -> Dict:
        """Delete employee with audit log"""
        # Get employee data before deletion for audit
        employee_to_delete = EmployeeService.get_employee_by_id(employee_id, current_user.company_id)
        
        # Delete the employee
        success = EmployeeService.delete_employee(employee_id, current_user.company_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found")
        
        # Log the action (if request and current_user are provided)
        if request and current_user and employee_to_delete:
            log_action(
                user_id=current_user.id,
                user_name=current_user.name,
                user_email=current_user.email,
                action="Employee Deleted",
                entity_type="employee",
                entity_id=employee_id,
                entity_name=employee_to_delete.get("name"),
                details=f"Employee {employee_to_delete.get('name')} was deleted",
                request=request,
                company_id=current_user.company_id
            )
        
        return {"message": "Employee deleted successfully"}
    
    @staticmethod
    def get_department_stats(current_user: User) -> Dict:
        """Get department statistics"""
        return EmployeeService.get_department_stats(current_user.company_id)
    
    @staticmethod
    def get_status_stats(current_user: User) -> Dict:
        """Get status statistics"""
        return EmployeeService.get_status_stats(current_user.company_id)
