from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.models import User
from app.schemas.user import UserCreate
from app.utils.password import get_password_hash
from typing import Optional
from datetime import datetime
    
class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        try:
            normalized_email = email.strip().lower()
            return db.query(User).filter(func.lower(User.email) == normalized_email).first()
        except Exception as e:
            print(f"Error getting user by email: {e}")
            return None

    @staticmethod
    def get_by_email_or_name(db: Session, identifier: str) -> Optional[User]:
        try:
            normalized_identifier = identifier.strip().lower()
            return db.query(User).filter(
                (func.lower(User.email) == normalized_identifier) | (func.lower(User.name) == normalized_identifier)
            ).first()
        except Exception as e:
            print(f"Error getting user by email or name: {e}")
            return None
    
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        try:
            return db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            print(f"Error getting user by id: {e}")
            return None

    @staticmethod
    def get_admins(db: Session, company_id: int = None):
        try:
            query = db.query(User).filter(User.role == 'admin')
            if company_id is not None:
                query = query.filter(User.company_id == company_id)
            return query.all()
        except Exception as e:
            print(f"Error getting admin users: {e}")
            return []

    @staticmethod
    def get_by_company(db: Session, company_id: int):
        try:
            return db.query(User).filter(User.company_id == company_id).order_by(User.created_at.desc()).all()
        except Exception as e:
            print(f"Error getting company users: {e}")
            return []
    
    @staticmethod
    def create(db: Session, user: UserCreate) -> User:
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
    def update_password(db: Session, identifier: str, new_password: str) -> Optional[User]:
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
    def update_role(db: Session, user_id: int, new_role: str) -> Optional[User]:
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
    def update_company(db: Session, user_id: int, company_id: int) -> Optional[User]:
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
    def deactivate_in_company(db: Session, user_id: int, company_id: int, deactivated_by: User = None) -> Optional[User]:
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
    def activate_in_company(db: Session, user_id: int, company_id: int) -> Optional[User]:
        try:
            user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
            if not user:
                return None
            user.is_active = True
            user.deactivated_by_user_id = None
            user.deactivated_by_name = None
            user.deactivated_at = None
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            print(f"Error activating user: {e}")
            db.rollback()
            return None
