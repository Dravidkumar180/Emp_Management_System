from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from app.controllers.auth_controller import AuthController
from app.repositories.user_repository import UserRepository
from app.database.database import SessionLocal
from app.utils.auth import decode_access_token

router = APIRouter()
security = HTTPBearer()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"

class LoginRequest(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str
    password: str
    confirm_password: str

@router.post("/auth/register")
async def register(user: RegisterRequest):
    """Register new user"""
    try:
        result = AuthController.register(user.dict())
        return result
    except Exception as e:
        print(f"Register route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login")
async def login(user: LoginRequest):
    """Login user"""
    try:
        result = AuthController.login(user.dict())
        if not result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/forgot-password")
async def forgot_password(data: PasswordResetRequest):
    """Reset password for a user"""
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    try:
        result = AuthController.reset_password({
            "email": data.email,
            "password": data.password
        })
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Forgot password route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/me")
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user info"""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = SessionLocal()
    try:
        user = UserRepository.get_by_email(db, payload.get("sub"))
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    finally:
        db.close()

@router.get("/auth/admins")
async def get_admin_reviewers(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        return AuthController.get_admin_reviewers()
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Get admin reviewers error: {exc}")
        raise HTTPException(status_code=500, detail="Unable to fetch admin reviewers")