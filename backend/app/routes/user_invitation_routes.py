"""Defines API routes for user invitation."""
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from app.database.models import User
from app.services.user_invitation_service import UserInvitationService
from app.utils.auth import get_admin_user, get_current_company_id


router = APIRouter()


# Defines the invitation create request class.
class InvitationCreateRequest(BaseModel):
    """Groups invitation create request helper functions."""
    email: EmailStr
    role: str = "user"
    expires_days: int = Field(7, ge=1, le=30)


# Defines the suspension request class.
class SuspensionRequest(BaseModel):
    """Defines the suspend request payload."""
    reason: Optional[str] = Field(None, max_length=500)


@router.post("/user-invitations")
# Creates invitation data.
async def create_invitation(
    invitation: InvitationCreateRequest,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    """Create invitation records."""
    return UserInvitationService.create_invitation(invitation.dict(), current_user, request)


@router.get("/user-invitations")
# Runs list invitations.
async def list_invitations(
    company_id: int = Depends(get_current_company_id),
    current_user: User = Depends(get_admin_user),
):
    """Runs list invitations logic."""
    return UserInvitationService.list_invitations(company_id)


@router.get("/user-invitations/members")
# Runs list members.
async def list_members(
    company_id: int = Depends(get_current_company_id),
    current_user: User = Depends(get_admin_user),
):
    """Runs list members logic."""
    return UserInvitationService.list_members(company_id)


@router.post("/user-invitations/{invitation_id}/revoke")
# Runs revoke invitation.
async def revoke_invitation(
    invitation_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    """Runs revoke invitation logic."""
    return UserInvitationService.revoke_invitation(invitation_id, current_user, request)


@router.post("/user-invitations/members/{user_id}/deactivate")
# Runs deactivate member.
async def deactivate_member(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    """Runs deactivate member logic."""
    return UserInvitationService.deactivate_member(user_id, current_user, request)


@router.post("/user-invitations/members/{user_id}/suspend")
# Runs suspend member.
async def suspend_member(
    user_id: int,
    suspension: SuspensionRequest,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    """Suspend a same-company user or admin without blocking login."""
    return UserInvitationService.suspend_member(user_id, suspension.reason, current_user, request)


@router.post("/user-invitations/members/{user_id}/reinstate")
# Runs reinstate member.
async def reinstate_member(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    """Reinstate a same-company suspended user or admin."""
    return UserInvitationService.reinstate_member(user_id, current_user, request)


@router.get("/invitations/{token}")
# Gets public invitation data.
async def get_public_invitation(token: str):
    """Returns public invitation data."""
    return UserInvitationService.get_public_invitation(token)