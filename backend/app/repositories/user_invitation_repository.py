"""Reads and writes user invitation data in the database."""
from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.models import UserInvitation


# Defines the user invitation repository class.
class UserInvitationRepository:
    """Groups user invitation repository helper functions."""
    @staticmethod
    # Creates this file data.
    def create(db: Session, invitation_data: dict) -> UserInvitation:
        """Runs create logic."""
        invitation = UserInvitation(**invitation_data)
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        return invitation

    @staticmethod
    # Gets data by token.
    def get_by_token(db: Session, token: str) -> Optional[UserInvitation]:
        """Returns by token data."""
        return db.query(UserInvitation).filter(UserInvitation.token == token).first()

    @staticmethod
    # Gets data by ID in company.
    def get_by_id_in_company(db: Session, invitation_id: int, company_id: int) -> Optional[UserInvitation]:
        """Returns by ID in company data."""
        return (
            db.query(UserInvitation)
            .filter(UserInvitation.id == invitation_id, UserInvitation.company_id == company_id)
            .first()
        )

    @staticmethod
    # Gets data by company.
    def get_by_company(db: Session, company_id: int):
        """Returns by company data."""
        return (
            db.query(UserInvitation)
            .filter(UserInvitation.company_id == company_id)
            .order_by(UserInvitation.created_at.desc())
            .all()
        )

    @staticmethod
    # Gets pending by email in company data.
    def get_pending_by_email_in_company(db: Session, email: str, company_id: int):
        """Returns pending by email in company data."""
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
    # Runs revoke.
    def revoke(db: Session, invitation: UserInvitation) -> UserInvitation:
        """Runs revoke logic."""
        invitation.status = "revoked"
        invitation.revoked_at = datetime.utcnow()
        invitation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(invitation)
        return invitation

    @staticmethod
    # Runs accept.
    def accept(db: Session, invitation: UserInvitation, user_id: int) -> UserInvitation:
        """Runs accept logic."""
        invitation.status = "accepted"
        invitation.accepted_by_user_id = user_id
        invitation.accepted_at = datetime.utcnow()
        invitation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(invitation)
        return invitation