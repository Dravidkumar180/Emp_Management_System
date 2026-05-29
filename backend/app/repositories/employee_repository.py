from sqlalchemy.orm import Session
from app.database.models import Employee, Department
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from typing import List, Optional
from datetime import datetime

class EmployeeRepository:
    """Repository for employee database operations"""
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Employee]:
        """Get all employees with pagination"""
        return db.query(Employee).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, employee_id: int) -> Optional[Employee]:
        """Get employee by ID"""
        return db.query(Employee).filter(Employee.id == employee_id).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Employee]:
        """Get employee by email"""
        return db.query(Employee).filter(Employee.email == email).first()
    
    @staticmethod
    def get_by_department(db: Session, department: str) -> List[Employee]:
        """Get employees by department"""
        return db.query(Employee).filter(Employee.department == department).all()
    
    @staticmethod
    def create(db: Session, employee: EmployeeCreate) -> Employee:
        """Create new employee"""
        # Generate username from name if not provided
        username = employee.username or employee.name.lower().replace(' ', '.')
        # Generate avatar from first letter
        avatar = employee.avatar or employee.name[0].upper()
        
        db_employee = Employee(
            name=employee.name,
            email=employee.email,
            username=username,
            phone=employee.phone or "",
            website=employee.website or "",
            company=employee.company or "",
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
    def update(db: Session, employee_id: int, employee_update: EmployeeUpdate) -> Optional[Employee]:
        """Update existing employee"""
        db_employee = EmployeeRepository.get_by_id(db, employee_id)
        if not db_employee:
            return None
        
        # Update only provided fields
        update_data = employee_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_employee, field, value)
        
        db_employee.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_employee)
        return db_employee
    
    @staticmethod
    def delete(db: Session, employee_id: int) -> bool:
        """Delete employee by ID"""
        db_employee = EmployeeRepository.get_by_id(db, employee_id)
        if not db_employee:
            return False
        db.delete(db_employee)
        db.commit()
        return True
    
    @staticmethod
    def get_stats_by_department(db: Session) -> dict:
        """Get employee count by department"""
        employees = EmployeeRepository.get_all(db)
        stats = {}
        for emp in employees:
            stats[emp.department] = stats.get(emp.department, 0) + 1
        return stats
    
    @staticmethod
    def get_stats_by_status(db: Session) -> dict:
        """Get employee count by status"""
        employees = EmployeeRepository.get_all(db)
        stats = {"Active": 0, "Remote": 0, "On Leave": 0, "Inactive": 0}
        for emp in employees:
            if emp.status in stats:
                stats[emp.status] += 1
            else:
                stats[emp.status] = 1
        return stats