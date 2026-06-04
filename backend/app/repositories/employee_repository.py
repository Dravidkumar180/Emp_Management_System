from sqlalchemy.orm import Session
from app.database.models import Employee  # Remove Department import
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from typing import List, Optional
from datetime import datetime

class EmployeeRepository:
    """Repository for employee database operations"""
    
    @staticmethod
    def get_all(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[Employee]:
        """Get all employees for a specific company"""
        return db.query(Employee).filter(Employee.company_id == company_id).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, employee_id: int, company_id: int) -> Optional[Employee]:
        """Get employee by ID with company check"""
        return db.query(Employee).filter(
            Employee.id == employee_id,
            Employee.company_id == company_id
        ).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str, company_id: int) -> Optional[Employee]:
        """Get employee by email within a specific company"""
        return db.query(Employee).filter(
            Employee.email == email,
            Employee.company_id == company_id
        ).first()
    
    @staticmethod
    def get_by_department(db: Session, department: str, company_id: int) -> List[Employee]:
        """Get employees by department within a specific company"""
        return db.query(Employee).filter(
            Employee.department == department,
            Employee.company_id == company_id
        ).all()
    
    @staticmethod
    def create(db: Session, employee: EmployeeCreate, company_id: int) -> Employee:
        """Create new employee for a specific company"""
        # Generate username from name if not provided
        username = employee.username or employee.name.lower().replace(' ', '.')
        # Generate avatar from first letter
        avatar = employee.avatar or employee.name[0].upper()
        
        db_employee = Employee(
            company_id=company_id,
            name=employee.name,
            email=employee.email,
            username=username,
            phone=employee.phone or "",
            website=employee.website or "",
            company_name=employee.company or "",
            department=employee.department,
            status=employee.status,
            role=employee.role,
            location=employee.location or "",
            join_date=employee.join_date or datetime.now().strftime("%Y-%m-%d"),
            avatar=avatar,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        return db_employee
    
    @staticmethod
    def update(db: Session, employee_id: int, company_id: int, employee_update: EmployeeUpdate) -> Optional[Employee]:
        """Update employee with company check"""
        db_employee = EmployeeRepository.get_by_id(db, employee_id, company_id)
        if not db_employee:
            return None
        
        update_data = employee_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_employee, field, value)
        
        db_employee.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_employee)
        return db_employee
    
    @staticmethod
    def delete(db: Session, employee_id: int, company_id: int) -> bool:
        """Delete employee with company check"""
        db_employee = EmployeeRepository.get_by_id(db, employee_id, company_id)
        if not db_employee:
            return False
        db.delete(db_employee)
        db.commit()
        return True
    
    @staticmethod
    def get_stats_by_department(db: Session, company_id: int) -> dict:
        """Get employee count by department within a specific company"""
        employees = EmployeeRepository.get_all(db, company_id)
        stats = {}
        for emp in employees:
            stats[emp.department] = stats.get(emp.department, 0) + 1
        return stats
    
    @staticmethod
    def get_stats_by_status(db: Session, company_id: int) -> dict:
        """Get employee count by status within a specific company"""
        employees = EmployeeRepository.get_all(db, company_id)
        stats = {"Active": 0, "Remote": 0, "On Leave": 0, "Inactive": 0}
        for emp in employees:
            if emp.status in stats:
                stats[emp.status] += 1
            else:
                stats[emp.status] = 1
        return stats
    
    @staticmethod
    def get_total_count(db: Session, company_id: int) -> int:
        """Get total number of employees in a specific company"""
        return db.query(Employee).filter(Employee.company_id == company_id).count()
    
    @staticmethod
    def get_active_count(db: Session, company_id: int) -> int:
        """Get number of active employees in a specific company"""
        return db.query(Employee).filter(
            Employee.company_id == company_id,
            Employee.status == "Active"
        ).count()
    
    @staticmethod
    def get_recent_employees(db: Session, company_id: int, limit: int = 5) -> List[Employee]:
        """Get most recently added employees for a specific company"""
        return db.query(Employee).filter(
            Employee.company_id == company_id
        ).order_by(Employee.created_at.desc()).limit(limit).all()