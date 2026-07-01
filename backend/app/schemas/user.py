"""Defines request and response data for user."""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

# Defines the user base class.
class UserBase(BaseModel):
    """Groups user base helper functions."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = "user"
    company_id: Optional[int] = None

    @field_validator('role')
    @classmethod
    # Helps with validate role.
    def validate_role(cls, v):
        """Runs validate role logic."""
        normalized = v.lower()
        if normalized not in ("admin", "user"):
            raise ValueError('Role must be "admin" or "user"')
        return normalized

# Defines the user create class.
class UserCreate(UserBase):
    """Groups user create helper functions."""
    password: str = Field(..., min_length=6)
    
    @field_validator('password')
    @classmethod
    # Helps with validate password.
    def validate_password(cls, v):
        """Runs validate password logic."""
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

# Defines the user login class.
class UserLogin(BaseModel):
    """Groups user login helper functions."""
    email: EmailStr
    password: str

# Defines the password reset request class.
class PasswordResetRequest(BaseModel):
    """Groups password reset request helper functions."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str

# Defines the user response class.
class UserResponse(UserBase):
    """Groups user response helper functions."""
    id: int
    is_active: bool
    created_at: datetime
    
    # Defines the config class.
    class Config:
        """Groups config helper functions."""
        from_attributes = True

# Defines the token class.
class Token(BaseModel):
    """Groups token helper functions."""
    access_token: str
    token_type: str
    user: UserResponse

# Defines the token data class.
class TokenData(BaseModel):
    """Groups token data helper functions."""
    email: Optional[str] = None
    role: Optional[str] = None