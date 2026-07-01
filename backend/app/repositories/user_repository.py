"""Reads and writes user data in the database."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.models import User
from app.schemas.user import UserCreate
from app.utils.password import get_password_hash
from typing import Optional
from datetime import datetime
    
# Defines the user repository class.
class UserRepository:
    """Groups user repository helper functions."""
    @staticmethod
    # Gets data by email.
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Returns by email data."""
        try:
            normalized_email = email.strip().lower()
            return db.query(User).filter(func.lower(User.email) == normalized_email).first()
        except Exception as e:
            print(f"Error getting user by email: {e}")
            return None

    @staticmethod
    # Gets data by email or name.
    def get_by_email_or_name(db: Session, identifier: str) -> Optional[User]:
        """Returns by email or name data."""
        try:
            normalized_identifier = identifier.strip().lower()
            return db.query(User).filter(
                (func.lower(User.email) == normalized_identifier) | (func.lower(User.name) == normalized_identifier)
            ).first()
        except Exception as e:
            print(f"Error getting user by email or name: {e}")
            return None
    
    @staticmethod
    # Gets data by ID.
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Returns by ID data."""
        try:
            return db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            print(f"Error getting user by id: {e}")
            return None

    @staticmethod
    # Gets admins data.
    def get_admins(db: Session, company_id: int = None):
        """Returns admins data."""
        try:
            query = db.query(User).filter(User.role == 'admin')
            if company_id is not None:
                query = query.filter(User.company_id == company_id)
            return query.all()
        except Exception as e:
            print(f"Error getting admin users: {e}")
            return []

    @staticmethod
    # Gets data by company.
    def get_by_company(db: Session, company_id: int):
        """Returns by company data."""
        try:
            return db.query(User).filter(User.company_id == company_id).order_by(User.created_at.desc()).all()
        except Exception as e:
            print(f"Error getting company users: {e}")
            return []
    
    @staticmethod
    # Creates this file data.
    def create(db: Session, user: UserCreate) -> User:
        """Runs create logic."""
        try:
            hashed_password = get_password_hash(user.password)
            normalized_email = user.email.strip().lower()
            normalized_name = user.name.strip()
            db_user = User(
                name=normalized_name,
                email=normalized_email,
                password=hashed_password,
                role=user.role,
                company_id=user.company_id
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            print(f"[+] User created in DB: {db_user.email}")
            return db_user
        except Exception as e:
            print(f"Error creating user: {e}")
            db.rollback()
            raise e

    @staticmethod
    # Updates password data.
    def update_password(db: Session, identifier: str, new_password: str) -> Optional[User]:
        """Update password records."""
        try:
            user = UserRepository.get_by_email_or_name(db, identifier)
            if not user:
                return None
            user.password = get_password_hash(new_password)
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"Error updating password: {e}")
            db.rollback()
            return None

    @staticmethod
    # Updates role data.
    def update_role(db: Session, user_id: int, new_role: str) -> Optional[User]:
        """Update role records."""
        try:
            user = UserRepository.get_by_id(db, user_id)
            if not user:
                return None
            user.role = new_role
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"Error updating role: {e}")
            db.rollback()
            return None

    @staticmethod
    # Updates company data.
    def update_company(db: Session, user_id: int, company_id: int) -> Optional[User]:
        """Update company records."""
        try:
            user = UserRepository.get_by_id(db, user_id)
            if not user:
                return None
            user.company_id = company_id
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"Error updating company: {e}")
            db.rollback()
            return None

    @staticmethod
    # Runs deactivate in company.
    def deactivate_in_company(db: Session, user_id: int, company_id: int, deactivated_by: User = None) -> Optional[User]:
        """Runs deactivate in company logic."""
        try:
            user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
            if not user:
                return None
            user.is_active = False
            if deactivated_by:
                user.deactivated_by_user_id = deactivated_by.id
                user.deactivated_by_name = deactivated_by.name
            user.deactivated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"Error deactivating user: {e}")
            db.rollback()
            return None

    @staticmethod
    # Runs suspend in company.
    def suspend_in_company(db: Session, user_id: int, company_id: int, suspended_by: User, reason: str) -> Optional[User]:
        """Suspend a company user without disabling login."""
        try:
            user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
            if not user:
                return None
            user.is_suspended = True
            user.suspension_reason = (reason or "").strip() or "No reason provided"
            user.suspended_by_user_id = suspended_by.id
            user.suspended_by_name = suspended_by.name
            user.suspended_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"Error suspending user: {e}")
            db.rollback()
            return None

    @staticmethod
    # Runs reinstate in company.
    def reinstate_in_company(db: Session, user_id: int, company_id: int) -> Optional[User]:
        """Remove suspension from a company user."""
        try:
            user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
            if not user:
                return None
            user.is_suspended = False
            user.suspension_reason = None
            user.suspended_by_user_id = None
            user.suspended_by_name = None
            user.suspended_at = None
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"Error reinstating user: {e}")
            db.rollback()
            return None

    @staticmethod
    # Runs activate in company.
    def activate_in_company(db: Session, user_id: int, company_id: int) -> Optional[User]:
        """Runs activate in company logic."""
        try:
            user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
            if not user:
                return None
            user.is_active = True
            user.deactivated_by_user_id = None
            user.deactivated_by_name = None
            user.deactivated_at = None
            user.is_suspended = False
            user.suspension_reason = None
            user.suspended_by_user_id = None
            user.suspended_by_name = None
            user.suspended_at = None
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"Error activating user: {e}")
            db.rollback()
            return None