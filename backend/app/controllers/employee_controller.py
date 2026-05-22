from typing import List, Dict
from fastapi import HTTPException
from app.services.employee_service import EmployeeService

class EmployeeController:
    """Controller layer for employee operations"""
    
    @staticmethod
    def get_all_employees() -> List[Dict]:
        """Get all employees"""
        employees = EmployeeService.get_all_employees()
        if not employees:
            raise HTTPException(status_code=404, detail="No employees found")
        return employees
    
    @staticmethod
    def get_employee(employee_id: int) -> Dict:
        """Get employee by ID"""
        employee = EmployeeService.get_employee_by_id(employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found")
        return employee
    
    @staticmethod
    def create_employee(employee_data: Dict) -> Dict:
        """Create new employee"""
        if not employee_data.get("name") or not employee_data.get("email"):
            raise HTTPException(status_code=400, detail="Name and email are required")
        return EmployeeService.create_employee(employee_data)
    
    @staticmethod
    def update_employee(employee_id: int, update_data: Dict) -> Dict:
        """Update employee"""
        employee = EmployeeService.update_employee(employee_id, update_data)
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found")
        return employee
    
    @staticmethod
    def delete_employee(employee_id: int) -> Dict:
        """Delete employee"""
        success = EmployeeService.delete_employee(employee_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found")
        return {"message": "Employee deleted successfully"}
    
    @staticmethod
    def get_department_stats() -> Dict:
        """Get department statistics"""
        return EmployeeService.get_department_stats()
    
    @staticmethod
    def get_status_stats() -> Dict:
        """Get status statistics"""
        return EmployeeService.get_status_stats()