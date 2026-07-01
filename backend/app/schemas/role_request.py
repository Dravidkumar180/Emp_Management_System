"""Defines request and response data for role request."""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

# Defines the role change request create class.
class RoleChangeRequestCreate(BaseModel):
    """Groups role change request create helper functions."""
    current_password: str = Field(..., min_length=6)
    admin_email: EmailStr

# Defines the role change request response class.
class RoleChangeRequestResponse(BaseModel):
    """Groups role change request response helper functions."""
    id: int
    requester_id: int
    requester_email: EmailStr
    admin_email: EmailStr
    status: str
    requested_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewer_id: Optional[int] = None

    # Defines the config class.
    class Config:
        """Groups config helper functions."""
        orm_mode = True

# Defines the role change request review response class.
class RoleChangeRequestReviewResponse(BaseModel):
    """Groups role change request review response helper functions."""
    message: str
    request: RoleChangeRequestResponse