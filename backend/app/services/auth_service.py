from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate
from app.utils.auth import verify_password, create_access_token
from app.database.database import SessionLocal
import traceback

class AuthService:
    @staticmethod
    def register(user_data: dict):
        db = SessionLocal()
        try:
            print(f"📝 Registering user: {user_data.get('email')}")
            
            # Check if user exists
            existing = UserRepository.get_by_email(db, user_data["email"])
            if existing:
                print(f"❌ User already exists: {user_data['email']}")
                return None
            
            # Create user
            user_create = UserCreate(**user_data)
            new_user = UserRepository.create(db, user_create)
            
            print(f"✅ User created: {new_user.email}")
            return {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role
            }
        except Exception as e:
            print(f"❌ Registration error: {e}")
            print(traceback.format_exc())
            return None
        finally:
            db.close()
    
    @staticmethod
    def login(login_data: dict):
        db = SessionLocal()
        try:
            print(f"📝 Login attempt: {login_data.get('email')}")
            
            user = UserRepository.get_by_email(db, login_data["email"])
            if not user:
                print(f"❌ User not found: {login_data['email']}")
                return None
            
            if not verify_password(login_data["password"], user.password):
                print(f"❌ Invalid password for: {login_data['email']}")
                return None
            
            access_token = create_access_token(
                data={"sub": user.email, "role": user.role}
            )
            
            print(f"✅ Login successful: {user.email}")
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role
                }
            }
        except Exception as e:
            print(f"❌ Login error: {e}")
            print(traceback.format_exc())
            return None
        finally:
            db.close()