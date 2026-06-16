from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.models import UserInvitation


class UserInvitationRepository:
    @staticmethod
    def create(db: Session, invitation_data: dict) -> UserInvitation:
        invitation = UserInvitation(**invitation_data)
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        return invitation

    @staticmethod
    def get_by_token(db: Session, token: str) -> Optional[UserInvitation]:
        return db.query(UserInvitation).filter(UserInvitation.token == token).first()

    @staticmethod
    def get_by_id_in_company(db: Session, invitation_id: int, company_id: int) -> Optional[UserInvitation]:
        return (
            db.query(UserInvitation)
            .filter(UserInvitation.id == invitation_id, UserInvitation.company_id == company_id)
            .first()
        )

    @staticmethod
    def get_by_company(db: Session, company_id: int):
        return (
            db.query(UserInvitation)
            .filter(UserInvitation.company_id == company_id)
            .order_by(UserInvitation.created_at.desc())
            .all()
        )

    @staticmethod
    def get_pending_by_email_in_company(db: Session, email: str, company_id: int):
        normalized_email = email.strip().lower()
        return (
            db.query(UserInvitation)
            .filter(
                func.lower(UserInvitation.email) == normalized_email,
                UserInvitation.company_id == company_id,
                UserInvitation.status == "pending",
                UserInvitation.expires_at > datetime.utcnow(),
            )
            .first()
        )

    @staticmethod
    def revoke(db: Session, invitation: UserInvitation) -> UserInvitation:
        invitation.status = "revoked"
        invitation.revoked_at = datetime.utcnow()
        invitation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(invitation)
        return invitation

    @staticmethod
    def accept(db: Session, invitation: UserInvitation, user_id: int) -> UserInvitation:
        invitation.status = "accepted"
        invitation.accepted_by_user_id = user_id
        invitation.accepted_at = datetime.utcnow()
        invitation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(invitation)
        return invitation
