"""Reads and writes role request data in the database."""
from sqlalchemy.orm import Session
from app.database.models import RoleChangeRequest
from typing import Optional, List
from datetime import datetime

# Defines the role request repository class.
class RoleRequestRepository:
    """Groups role request repository helper functions."""
    @staticmethod
    # Creates this file data.
    def create(db: Session, requester_id: int, requester_email: str, admin_email: str) -> RoleChangeRequest:
        """Runs create logic."""
        role_request = RoleChangeRequest(
            user_id=requester_id,
            requester_id=requester_id,
            requester_email=requester_email.strip().lower(),
            admin_email=admin_email.strip().lower(),
            status='pending'
        )
        db.add(role_request)
        db.commit()
        db.refresh(role_request)
        return role_request

    @staticmethod
    # Gets data by ID.
    def get_by_id(db: Session, request_id: int) -> Optional[RoleChangeRequest]:
        """Returns by ID data."""
        return db.query(RoleChangeRequest).filter(RoleChangeRequest.id == request_id).first()

    @staticmethod
    # Gets data by requester email.
    def get_by_requester_email(db: Session, requester_email: str):
        """Returns by requester email data."""
        normalized_requester_email = requester_email.strip().lower()
        return db.query(RoleChangeRequest).filter(
            RoleChangeRequest.requester_email == normalized_requester_email
        ).order_by(RoleChangeRequest.requested_at.desc()).all()

    @staticmethod
    # Gets pending by admin email data.
    def get_pending_by_admin_email(db: Session, admin_email: str):
        """Returns pending by admin email data."""
        normalized_admin_email = admin_email.strip().lower()
        return db.query(RoleChangeRequest).filter(
            RoleChangeRequest.admin_email == normalized_admin_email,
            RoleChangeRequest.status == 'pending'
        ).order_by(RoleChangeRequest.requested_at.desc()).all()

    @staticmethod
    # Updates status data.
    def update_status(db: Session, request_obj: RoleChangeRequest, status: str, reviewer_id: Optional[int] = None) -> RoleChangeRequest:
        """Update status records."""
        request_obj.status = status
        request_obj.reviewed_at = datetime.utcnow()
        request_obj.reviewer_id = reviewer_id
        db.commit()
        db.refresh(request_obj)
        return request_obj