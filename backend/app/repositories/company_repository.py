"""Reads and writes company data in the database."""
from sqlalchemy.orm import Session
from app.database.models import Company, User, Employee
from app.schemas.company import CompanyCreate, CompanyUpdate
from typing import List, Optional
from datetime import datetime

# Defines the company repository class.
class CompanyRepository:
    """Repository for company database operations with multi-tenant support"""
    
    @staticmethod
    # Gets all records.
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Company]:
        """
        Get all companies with pagination
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
        Returns:
            List of all companies
        """
        return db.query(Company).offset(skip).limit(limit).all()
    
    @staticmethod
    # Gets data by ID.
    def get_by_id(db: Session, company_id: int) -> Optional[Company]:
        """
        Get company by ID
        Args:
            db: Database session
            company_id: Company ID to fetch
        Returns:
            Company object if found, else None
        """
        return db.query(Company).filter(Company.id == company_id).first()
    
    @staticmethod
    # Gets data by name.
    def get_by_name(db: Session, name: str) -> Optional[Company]:
        """
        Get company by name
        Args:
            db: Database session
            name: Company name to search for
        Returns:
            Company object if found, else None
        """
        return db.query(Company).filter(Company.name == name).first()
    
    @staticmethod
    # Gets data by slug.
    def get_by_slug(db: Session, slug: str) -> Optional[Company]:
        """
        Get company by slug (URL-friendly identifier)
        Args:
            db: Database session
            slug: Company slug to search for
        Returns:
            Company object if found, else None
        """
        return db.query(Company).filter(Company.slug == slug).first()
    
    @staticmethod
    # Gets user company data.
    def get_user_company(db: Session, user_id: int) -> Optional[Company]:
        """
        Get company for a specific user
        Args:
            db: Database session
            user_id: User ID to find company for
        Returns:
            Company object if user has a company, else None
        """
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.company_id:
            return db.query(Company).filter(Company.id == user.company_id).first()
        return None
    
    @staticmethod
    # Gets all active data.
    def get_all_active(db: Session) -> List[Company]:
        """
        Get all active companies
        Args:
            db: Database session
        Returns:
            List of active companies
        """
        return db.query(Company).filter(Company.is_active == True).all()
    
    @staticmethod
    # Creates this file data.
    def create(db: Session, company: CompanyCreate) -> Company:
        """
        Create new company
        Args:
            db: Database session
            company: Company data to create
        Returns:
            Newly created company object
        """
        # Generate slug from company name
        slug = company.name.lower().replace(' ', '-').replace('_', '-')
        
        db_company = Company(
            name=company.name,
            slug=slug,
            email=company.email,
            phone=company.phone,
            address=company.address,
            website=company.website,
            subscription_plan=company.subscription_plan,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        return db_company
    
    @staticmethod
    # Updates this record.
    def update(db: Session, company_id: int, company_update: CompanyUpdate) -> Optional[Company]:
        """
        Update existing company
        Args:
            db: Database session
            company_id: ID of company to update
            company_update: Updated company data
        Returns:
            Updated company object if found, else None
        """
        db_company = CompanyRepository.get_by_id(db, company_id)
        if not db_company:
            return None
        
        # Update only provided fields (exclude unset)
        update_data = company_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                # If name is updated, update slug as well
                if field == "name":
                    setattr(db_company, "slug", value.lower().replace(' ', '-').replace('_', '-'))
                setattr(db_company, field, value)
        
        db_company.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_company)
        return db_company
    
    @staticmethod
    # Deletes this record.
    def delete(db: Session, company_id: int) -> bool:
        """
        Delete company by ID
        Args:
            db: Database session
            company_id: ID of company to delete
        Returns:
            True if deleted, False if not found
        """
        db_company = CompanyRepository.get_by_id(db, company_id)
        if not db_company:
            return False
        db.delete(db_company)
        db.commit()
        return True
    
    @staticmethod
    # Runs activate.
    def activate(db: Session, company_id: int) -> Optional[Company]:
        """
        Activate a company
        Args:
            db: Database session
            company_id: ID of company to activate
        Returns:
            Updated company object if found, else None
        """
        db_company = CompanyRepository.get_by_id(db, company_id)
        if not db_company:
            return None
        
        db_company.is_active = True
        db_company.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_company)
        return db_company
    
    @staticmethod
    # Runs deactivate.
    def deactivate(db: Session, company_id: int) -> Optional[Company]:
        """
        Deactivate a company
        Args:
            db: Database session
            company_id: ID of company to deactivate
        Returns:
            Updated company object if found, else None
        """
        db_company = CompanyRepository.get_by_id(db, company_id)
        if not db_company:
            return None
        
        db_company.is_active = False
        db_company.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_company)
        return db_company
    
    @staticmethod
    # Gets company stats data.
    def get_company_stats(db: Session, company_id: int) -> dict:
        """
        Get statistics for a specific company
        Args:
            db: Database session
            company_id: ID of company to get stats for
        Returns:
            Dictionary with company statistics
        """
        # Get employees count
        employees = db.query(Employee).filter(Employee.company_id == company_id).all()
        total_employees = len(employees)
        active_employees = len([e for e in employees if e.status == "Active"])
        
        # Get unique departments
        departments = len(set([e.department for e in employees if e.department]))
        
        # Get users count
        users = db.query(User).filter(User.company_id == company_id).all()
        total_users = len(users)
        
        # Department-wise distribution
        dept_distribution = {}
        for emp in employees:
            dept_distribution[emp.department] = dept_distribution.get(emp.department, 0) + 1
        
        # Status-wise distribution
        status_distribution = {"Active": 0, "Remote": 0, "On Leave": 0, "Inactive": 0}
        for emp in employees:
            if emp.status in status_distribution:
                status_distribution[emp.status] += 1
            else:
                status_distribution[emp.status] = 1
        
        return {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "departments": departments,
            "total_users": total_users,
            "attendance_rate": round((active_employees / total_employees) * 100) if total_employees > 0 else 0,
            "department_distribution": dept_distribution,
            "status_distribution": status_distribution
        }
    
    @staticmethod
    # Gets company users data.
    def get_company_users(db: Session, company_id: int) -> List[User]:
        """
        Get all users belonging to a company
        Args:
            db: Database session
            company_id: ID of company to get users for
        Returns:
            List of users in the company
        """
        return db.query(User).filter(User.company_id == company_id).all()
    
    @staticmethod
    # Gets company employees count data.
    def get_company_employees_count(db: Session, company_id: int) -> int:
        """
        Get total number of employees in a company
        Args:
            db: Database session
            company_id: ID of company to count employees for
        Returns:
            Total employee count
        """
        return db.query(Employee).filter(Employee.company_id == company_id).count()