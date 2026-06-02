from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class RoleChangeRequestCreate(BaseModel):
    current_password: str = Field(..., min_length=6)
    admin_email: EmailStr

class RoleChangeRequestResponse(BaseModel):
    id: int
    requester_id: int
    requester_email: EmailStr
    admin_email: EmailStr
    status: str
    requested_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewer_id: Optional[int] = None

    class Config:
        orm_mode = True

class RoleChangeRequestReviewResponse(BaseModel):
    message: str
    request: RoleChangeRequestResponse
