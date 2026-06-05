from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.database.database import SessionLocal
from typing import List, Dict, Optional

class EmployeeService:
    """Service layer for employee business logic"""
    
    @staticmethod
    def get_all_employees(company_id: int) -> List[Dict]:
        """Get all employees from database"""
        db = SessionLocal()
        try:
            employees = EmployeeRepository.get_all(db, company_id)
            result = []
            for emp in employees:
                result.append({
                    "id": emp.id,
                    "name": emp.name,
                    "email": emp.email,
                    "username": emp.username,
                    "phone": emp.phone,
                    "website": emp.website,
                    "company": emp.company_name,
                    "department": emp.department,
                    "status": emp.status,
                    "role": emp.role,
                    "location": emp.location,
                    "join_date": emp.join_date,
                    "avatar": emp.avatar,
                    "created_at": emp.created_at.isoformat() if emp.created_at else None,
                    "updated_at": emp.updated_at.isoformat() if emp.updated_at else None
                })
            return result
        except Exception as e:
            print(f"Error getting employees: {e}")
            return []
        finally:
            db.close()
    
    @staticmethod
    def get_employee_by_id(employee_id: int, company_id: int) -> Optional[Dict]:
        """Get employee by ID from database"""
        db = SessionLocal()
        try:
            emp = EmployeeRepository.get_by_id(db, employee_id, company_id)
            if not emp:
                return None
            return {
                "id": emp.id,
                "name": emp.name,
                "email": emp.email,
                "username": emp.username,
                "phone": emp.phone,
                "website": emp.website,
                "company": emp.company_name,
                "department": emp.department,
                "status": emp.status,
                "role": emp.role,
                "location": emp.location,
                "join_date": emp.join_date,
                "avatar": emp.avatar,
                "created_at": emp.created_at.isoformat() if emp.created_at else None,
                "updated_at": emp.updated_at.isoformat() if emp.updated_at else None
            }
        except Exception as e:
            print(f"Error getting employee by ID: {e}")
            return None
        finally:
            db.close()
    
    @staticmethod
    def create_employee(employee_data: Dict, company_id: int) -> Dict:
        """Create new employee in database"""
        db = SessionLocal()
        try:
            # Validate required fields
            if not employee_data.get("name"):
                raise ValueError("Name is required")
            if not employee_data.get("email"):
                raise ValueError("Email is required")
            
            # Create employee using repository
            employee_create = EmployeeCreate(**employee_data)
            new_employee = EmployeeRepository.create(db, employee_create, company_id)
            
            # Commit is handled in repository
            return {
                "id": new_employee.id,
                "name": new_employee.name,
                "email": new_employee.email,
                "username": new_employee.username,
                "phone": new_employee.phone,
                "website": new_employee.website,
                "company": new_employee.company_name,
                "department": new_employee.department,
                "status": new_employee.status,
                "role": new_employee.role,
                "location": new_employee.location,
                "join_date": new_employee.join_date,
                "avatar": new_employee.avatar,
                "message": "Employee created successfully"
            }
        except Exception as e:
            print(f"Error creating employee: {e}")
            db.rollback()
            raise e
        finally:
            db.close()
    
    @staticmethod
    def update_employee(employee_id: int, update_data: Dict, company_id: int) -> Optional[Dict]:
        """Update employee in database"""
        db = SessionLocal()
        try:
            # Check if employee exists
            existing = EmployeeRepository.get_by_id(db, employee_id, company_id)
            if not existing:
                return None
            
            # Update employee
            employee_update = EmployeeUpdate(**update_data)
            updated = EmployeeRepository.update(db, employee_id, company_id, employee_update)
            
            if not updated:
                return None
            
            return {
                "id": updated.id,
                "name": updated.name,
                "email": updated.email,
                "username": updated.username,
                "phone": updated.phone,
                "website": updated.website,
                "company": updated.company_name,
                "department": updated.department,
                "status": updated.status,
                "role": updated.role,
                "location": updated.location,
                "join_date": updated.join_date,
                "avatar": updated.avatar,
                "message": "Employee updated successfully"
            }
        except Exception as e:
            print(f"Error updating employee: {e}")
            db.rollback()
            raise e
        finally:
            db.close()
    
    @staticmethod
    def delete_employee(employee_id: int, company_id: int) -> bool:
        """Delete employee from database"""
        db = SessionLocal()
        try:
            # Check if employee exists
            existing = EmployeeRepository.get_by_id(db, employee_id, company_id)
            if not existing:
                return False
            
            # Delete employee
            success = EmployeeRepository.delete(db, employee_id, company_id)
            return success
        except Exception as e:
            print(f"Error deleting employee: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    @staticmethod
    def get_department_stats(company_id: int) -> Dict:
        """Get department statistics from database"""
        db = SessionLocal()
        try:
            return EmployeeRepository.get_stats_by_department(db, company_id)
        except Exception as e:
            print(f"Error getting department stats: {e}")
            return {}
        finally:
            db.close()
    
    @staticmethod
    def get_status_stats(company_id: int) -> Dict:
        """Get status statistics from database"""
        db = SessionLocal()
        try:
            return EmployeeRepository.get_stats_by_status(db, company_id)
        except Exception as e:
            print(f"Error getting status stats: {e}")
            return {}
        finally:
            db.close()
