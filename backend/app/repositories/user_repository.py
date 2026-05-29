from sqlalchemy.orm import Session
from app.database.models import User
from app.schemas.user import UserCreate
from app.utils.auth import get_password_hash
from typing import Optional

class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        try:
            return db.query(User).filter(User.email == email).first()
        except Exception as e:
            print(f"Error getting user by email: {e}")
            return None
    
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        try:
            return db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            print(f"Error getting user by id: {e}")
            return None
    
    @staticmethod
    def create(db: Session, user: UserCreate) -> User:
        try:
            hashed_password = get_password_hash(user.password)
            db_user = User(
                name=user.name,
                email=user.email,
                password=hashed_password,
                role=user.role
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            print(f"✅ User created in DB: {db_user.email}")
            return db_user
        except Exception as e:
            print(f"Error creating user: {e}")
            db.rollback()
            raise e