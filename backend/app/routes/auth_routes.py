"""Defines API routes for auth."""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Union
from datetime import datetime
from uuid import uuid4
from app.controllers.auth_controller import AuthController
from app.repositories.user_repository import UserRepository
from app.database.database import SessionLocal
from app.utils.audit_helper import log_action
from app.utils.auth import decode_access_token, get_current_active_user
from app.database.models import LoginDeviceSession, User

router = APIRouter()
security = HTTPBearer()

# Defines the register request class.
class RegisterRequest(BaseModel):
    """Groups register request helper functions."""
    name: str
    email: EmailStr
    password: str
    role: str = "user"
    company_id: Optional[Union[int, str]] = None
    invite_token: Optional[str] = None

# Defines the login request class.
class LoginRequest(BaseModel):
    """Groups login request helper functions."""
    email: str
    password: str
    company_id: Optional[Union[int, str]] = None
    browser: Optional[str] = None
    device_name: Optional[str] = None
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None

# Defines the password reset request class.
class PasswordResetRequest(BaseModel):
    """Groups password reset request helper functions."""
    email: str
    password: str
    confirm_password: str

@router.post("/auth/register")
# Runs register.
async def register(user: RegisterRequest):
    """Register new user"""
    try:
        result = AuthController.register(user.dict())
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Register route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/login")
# Helps with login.
async def login(user: LoginRequest, request: Request):
    """Login user"""
    try:
        result = AuthController.login(user.dict())
        if not result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            session = LoginDeviceSession(
                session_identifier=f"sess_{uuid4().hex[:16]}",
                user_id=result["user"]["id"],
                user_name=result["user"]["name"],
                user_email=result["user"]["email"],
                company_id=result["user"]["company_id"],
                browser=user.browser or request.headers.get("user-agent", "Unknown Browser")[:120],
                device_name=user.device_name or "Current Device",
                device_info=user.device_info or request.headers.get("user-agent", "Unknown Device")[:250],
                ip_address=user.ip_address or (request.client.host if request.client else "Unknown"),
                location=user.location or "Unknown Location",
                login_time=now,
                last_activity_time=now,
                status="Active",
                trusted=False,
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            log_action(
                result["user"]["id"], result["user"]["name"], result["user"]["email"],
                "User Login", "login_device", session.id, session.device_name,
                f"User logged in with session {session.session_identifier}",
                request=request, company_id=result["user"]["company_id"],
            )
            result["session"] = {
                "id": session.id,
                "session_identifier": session.session_identifier,
                "status": session.status,
            }
        finally:
            db.close()
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/forgot-password")
# Runs forgot password.
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
# Gets me data.
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
            "role": user.role,
            "company_id": user.company_id,
            "is_active": user.is_active,
            "is_suspended": user.is_suspended,
            "suspension_reason": user.suspension_reason,
            "suspended_by_user_id": user.suspended_by_user_id,
            "suspended_by_name": user.suspended_by_name,
            "suspended_at": user.suspended_at,
            "deactivated_by_user_id": user.deactivated_by_user_id,
            "deactivated_by_name": user.deactivated_by_name,
            "deactivated_at": user.deactivated_at
        }
    finally:
        db.close()

@router.get("/auth/admins")
# Gets admin reviewers data.
async def get_admin_reviewers(current_user: User = Depends(get_current_active_user)):
    """Returns admin reviewers data."""
    try:
        return AuthController.get_admin_reviewers(current_user.company_id)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Get admin reviewers error: {exc}")
        raise HTTPException(status_code=500, detail="Unable to fetch admin reviewers")
