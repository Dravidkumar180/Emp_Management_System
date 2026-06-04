from sqlalchemy.orm import Session
from app.database.models import Department
from typing import List, Optional

class DepartmentRepository:
    """Repository for department operations (Bonus)"""
    
    @staticmethod
    def get_all(db: Session) -> List[Department]:
        """Get all departments"""
        return db.query(Department).all()
    
    @staticmethod
    def get_by_id(db: Session, department_id: int) -> Optional[Department]:
        """Get department by ID"""
        return db.query(Department).filter(Department.id == department_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Department]:
        """Get department by name"""
        return db.query(Department).filter(Department.name == name).first()
    
    @staticmethod
    def create(db: Session, name: str, description: str = None) -> Department:
        """Create new department"""
        db_department = Department(name=name, description=description)
        db.add(db_department)
        db.commit()
        db.refresh(db_department)
        return db_department
    
    @staticmethod
    def update(db: Session, department_id: int, name: str = None, description: str = None) -> Optional[Department]:
        """Update department"""
        db_department = DepartmentRepository.get_by_id(db, department_id)
        if not db_department:
            return None
        if name:
            db_department.name = name
        if description:
            db_department.description = description
        db.commit()
        db.refresh(db_department)
        return db_department
    
    @staticmethod
    def delete(db: Session, department_id: int) -> bool:
        """Delete department"""
        db_department = DepartmentRepository.get_by_id(db, department_id)
        if not db_department:
            return False
        db.delete(db_department)
        db.commit()
        return True
    
    @staticmethod
    def init_default_departments(db: Session):
        """Initialize default departments"""
        default_departments = [
            "Engineering", "Human Resources", "Marketing", 
            "Sales", "Finance", "Operations", "IT", "Product", "Design", "Data"
        ]
        for dept_name in default_departments:
            existing = DepartmentRepository.get_by_name(db, dept_name)
            if not existing:
                DepartmentRepository.create(db, dept_name)
        print("[+] Default departments initialized")