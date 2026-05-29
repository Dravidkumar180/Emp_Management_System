from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from app.controllers.auth_controller import AuthController
from app.utils.auth import decode_access_token

router = APIRouter()
security = HTTPBearer()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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

@router.get("/auth/me")
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user info"""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"email": payload.get("sub"), "role": payload.get("role")}