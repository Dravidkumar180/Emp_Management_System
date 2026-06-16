from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, Field

from app.database.models import User
from app.services.user_invitation_service import UserInvitationService
from app.utils.auth import get_admin_user, get_current_company_id


router = APIRouter()


class InvitationCreateRequest(BaseModel):
    email: EmailStr
    role: str = "user"
    expires_days: int = Field(7, ge=1, le=30)


@router.post("/user-invitations")
async def create_invitation(
    invitation: InvitationCreateRequest,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    return UserInvitationService.create_invitation(invitation.dict(), current_user, request)


@router.get("/user-invitations")
async def list_invitations(
    company_id: int = Depends(get_current_company_id),
    current_user: User = Depends(get_admin_user),
):
    return UserInvitationService.list_invitations(company_id)


@router.get("/user-invitations/members")
async def list_members(
    company_id: int = Depends(get_current_company_id),
    current_user: User = Depends(get_admin_user),
):
    return UserInvitationService.list_members(company_id)


@router.post("/user-invitations/{invitation_id}/revoke")
async def revoke_invitation(
    invitation_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    return UserInvitationService.revoke_invitation(invitation_id, current_user, request)


@router.post("/user-invitations/members/{user_id}/deactivate")
async def deactivate_member(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    return UserInvitationService.deactivate_member(user_id, current_user, request)


@router.get("/invitations/{token}")
async def get_public_invitation(token: str):
    return UserInvitationService.get_public_invitation(token)
