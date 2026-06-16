from datetime import datetime, timedelta
import secrets
from typing import Dict, List, Optional

from fastapi import HTTPException, Request

from app.database.database import SessionLocal
from app.database.models import User, UserInvitation
from app.repositories.user_invitation_repository import UserInvitationRepository
from app.repositories.user_repository import UserRepository
from app.utils.audit_helper import log_action


def _serialize_invitation(invitation: UserInvitation) -> Dict:
    return {
        "id": invitation.id,
        "company_id": invitation.company_id,
        "email": invitation.email,
        "role": invitation.role,
        "token": invitation.token,
        "status": invitation.status,
        "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
        "created_at": invitation.created_at.isoformat() if invitation.created_at else None,
        "accepted_at": invitation.accepted_at.isoformat() if invitation.accepted_at else None,
        "revoked_at": invitation.revoked_at.isoformat() if invitation.revoked_at else None,
    }


def _serialize_member(user: User) -> Dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "company_id": user.company_id,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


class UserInvitationService:
    @staticmethod
    def create_invitation(invite_data: Dict, admin_user: User, request: Optional[Request] = None) -> Dict:
        db = SessionLocal()
        try:
            if not admin_user.company_id:
                raise HTTPException(status_code=403, detail="Admin must belong to a company")

            email = invite_data["email"].strip().lower()
            role = invite_data.get("role", "user").strip().lower()
            expires_days = int(invite_data.get("expires_days", 7))

            if role not in ("admin", "user"):
                raise HTTPException(status_code=400, detail="Role must be admin or user")
            if expires_days < 1 or expires_days > 30:
                raise HTTPException(status_code=400, detail="Expiration must be between 1 and 30 days")

            existing_user = UserRepository.get_by_email(db, email)
            if existing_user:
                raise HTTPException(status_code=400, detail="A user with this email already exists")

            existing_invite = UserInvitationRepository.get_pending_by_email_in_company(
                db, email, admin_user.company_id
            )
            if existing_invite:
                return _serialize_invitation(existing_invite)

            invitation = UserInvitationRepository.create(
                db,
                {
                    "company_id": admin_user.company_id,
                    "email": email,
                    "role": role,
                    "token": secrets.token_urlsafe(32),
                    "status": "pending",
                    "invited_by_user_id": admin_user.id,
                    "expires_at": datetime.utcnow() + timedelta(days=expires_days),
                },
            )

            log_action(
                user_id=admin_user.id,
                user_name=admin_user.name,
                user_email=admin_user.email,
                action="Invitation Created",
                entity_type="user_invitation",
                entity_id=invitation.id,
                entity_name=email,
                details=f"Invitation created for {email}",
                request=request,
                company_id=admin_user.company_id,
            )
            return _serialize_invitation(invitation)
        finally:
            db.close()

    @staticmethod
    def list_invitations(company_id: int) -> List[Dict]:
        db = SessionLocal()
        try:
            invitations = UserInvitationRepository.get_by_company(db, company_id)
            return [_serialize_invitation(invitation) for invitation in invitations]
        finally:
            db.close()

    @staticmethod
    def list_members(company_id: int) -> List[Dict]:
        db = SessionLocal()
        try:
            members = UserRepository.get_by_company(db, company_id)
            return [_serialize_member(member) for member in members]
        finally:
            db.close()

    @staticmethod
    def revoke_invitation(invitation_id: int, admin_user: User, request: Optional[Request] = None) -> Dict:
        db = SessionLocal()
        try:
            invitation = UserInvitationRepository.get_by_id_in_company(db, invitation_id, admin_user.company_id)
            if not invitation:
                raise HTTPException(status_code=404, detail="Invitation not found")
            if invitation.status != "pending":
                raise HTTPException(status_code=400, detail="Only pending invitations can be revoked")

            revoked = UserInvitationRepository.revoke(db, invitation)
            log_action(
                user_id=admin_user.id,
                user_name=admin_user.name,
                user_email=admin_user.email,
                action="Invitation Revoked",
                entity_type="user_invitation",
                entity_id=revoked.id,
                entity_name=revoked.email,
                details=f"Invitation revoked for {revoked.email}",
                request=request,
                company_id=admin_user.company_id,
            )
            return _serialize_invitation(revoked)
        finally:
            db.close()

    @staticmethod
    def deactivate_member(user_id: int, admin_user: User, request: Optional[Request] = None) -> Dict:
        if user_id == admin_user.id:
            raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

        db = SessionLocal()
        try:
            member = UserRepository.deactivate_in_company(db, user_id, admin_user.company_id, admin_user)
            if not member:
                raise HTTPException(status_code=404, detail="Member not found")

            log_action(
                user_id=admin_user.id,
                user_name=admin_user.name,
                user_email=admin_user.email,
                action="User Deactivated",
                entity_type="user",
                entity_id=member.id,
                entity_name=member.email,
                details=f"User {member.email} was deactivated",
                request=request,
                company_id=admin_user.company_id,
            )
            return _serialize_member(member)
        finally:
            db.close()

    @staticmethod
    def get_public_invitation(token: str) -> Dict:
        db = SessionLocal()
        try:
            invitation = UserInvitationRepository.get_by_token(db, token)
            if not invitation:
                raise HTTPException(status_code=404, detail="Invitation not found")

            data = _serialize_invitation(invitation)
            data.pop("token", None)
            data["is_expired"] = invitation.expires_at <= datetime.utcnow()
            return data
        finally:
            db.close()

    @staticmethod
    def validate_invitation_for_registration(db, token: str, email: str) -> UserInvitation:
        invitation = UserInvitationRepository.get_by_token(db, token)
        if not invitation:
            raise HTTPException(status_code=400, detail="Invalid invitation")
        if invitation.status != "pending":
            raise HTTPException(status_code=400, detail="Invitation is not pending")
        if invitation.expires_at <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invitation has expired")
        if invitation.email.lower() != email.strip().lower():
            raise HTTPException(status_code=400, detail="Invitation email does not match")
        return invitation

    @staticmethod
    def mark_accepted(db, invitation: UserInvitation, user_id: int):
        return UserInvitationRepository.accept(db, invitation, user_id)
