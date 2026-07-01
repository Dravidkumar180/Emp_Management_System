"""Shared backend helper functions."""
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database.database import SessionLocal
from app.database.models import User

# JWT settings
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Security scheme for bearer tokens
security = HTTPBearer()

# Import password utilities (no circular dependency)
from app.utils.password import verify_password, get_password_hash


COMPANY_SLUG_TO_ID = {
    "company-a": 1,
    "company-b": 2,
}


# Helps with normalize company id.
def normalize_company_id(company_id) -> Optional[int]:
    """Runs normalize company ID logic."""
    if company_id is None or company_id == "":
        return None
    if isinstance(company_id, int):
        return company_id

    normalized = str(company_id).strip().lower()
    if normalized in COMPANY_SLUG_TO_ID:
        return COMPANY_SLUG_TO_ID[normalized]

    try:
        return int(normalized)
    except ValueError:
        return None


# ========== JWT TOKEN FUNCTIONS ==========

# Creates access token data.
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token with company info
    Args:
        data: Dictionary containing user info (email, role, company_id)
        expires_delta: Optional custom expiration time
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Helps with ensure not suspended.
def ensure_not_suspended(user: User) -> None:
    """Block application access for suspended accounts while preserving login."""
    if getattr(user, "is_suspended", False):
        raise HTTPException(status_code=403, detail="Account suspended")


# Helps with decode access token.
def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode JWT access token
    Args:
        token: JWT token string
    Returns:
        Decoded payload dictionary if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ========== AUTHENTICATION DEPENDENCIES ==========

# Gets current user data.
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Get current user from token with company info
    This function is used as a dependency for protected routes
    Args:
        credentials: HTTP Bearer token credentials
    Returns:
        User object with company_id attached
    Raises:
        HTTPException 401 if token is invalid or user not found
    """
    from app.repositories.user_repository import UserRepository
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db = SessionLocal()
    try:
        # Get user by email from token
        user = UserRepository.get_by_email(db, payload.get("sub"))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Keep role and company from DB so stale tokens cannot change account scope.
        
        return user
    finally:
        db.close()


# Gets current active user data.
async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if current user is active
    Args:
        current_user: User from get_current_user dependency
    Returns:
        User object if active
    Raises:
        HTTPException 400 if user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    ensure_not_suspended(current_user)
    return current_user


# ========== ROLE-BASED ACCESS CONTROL ==========

# Gets admin user data.
async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if current user has admin role
    Args:
        current_user: User from get_current_user dependency
    Returns:
        User object if admin
    Raises:
        HTTPException 403 if user is not admin
    """
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    ensure_not_suspended(current_user)
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# Gets super admin data.
async def get_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if current user is super admin
    Args:
        current_user: User from get_current_user dependency
    Returns:
        User object if super admin
    Raises:
        HTTPException 403 if user is not super admin
    """
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    ensure_not_suspended(current_user)
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user


# Gets company user data.
async def get_company_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if current user belongs to a company
    Args:
        current_user: User from get_current_user dependency
    Returns:
        User object with company_id
    Raises:
        HTTPException 403 if user has no company
    """
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    ensure_not_suspended(current_user)
    if not current_user.company_id:
        raise HTTPException(status_code=403, detail="User does not belong to any company")
    return current_user


# ========== COMPANY ISOLATION HELPER ==========

# Gets current company id data.
def get_current_company_id(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> int:
    """
    Get current user's company ID
    Args:
        current_user: User from get_current_user dependency
    Returns:
        Company ID
    Raises:
        HTTPException 403 if user has no company
    """
    company_id = normalize_company_id(current_user.company_id)

    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    ensure_not_suspended(current_user)

    if company_id is None and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="No company associated with user")
    return company_id


# ========== TOKEN REFRESH FUNCTION ==========

# Runs refresh access token.
def refresh_access_token(refresh_token: str) -> Optional[str]:
    """
    Refresh access token (for extending session)
    Args:
        refresh_token: Valid refresh token
    Returns:
        New access token or None if invalid
    """
    payload = decode_access_token(refresh_token)
    if not payload:
        return None
    
    # Create new token with same data but new expiration
    new_token = create_access_token({
        "sub": payload.get("sub"),
        "role": payload.get("role"),
        "company_id": payload.get("company_id")
    })
    return new_token


# ========== LOGIN HELPER ==========

# Creates login response data.
def create_login_response(user: User, company_id: Optional[int] = None) -> dict:
    """
    Create login response with access token
    Args:
        user: User object
        company_id: Optional company ID (overrides user's company)
    Returns:
        Dictionary with access_token, token_type, and user info
    """
    final_company_id = company_id or user.company_id
    
    access_token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "company_id": final_company_id
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company_id": final_company_id
        }
    }