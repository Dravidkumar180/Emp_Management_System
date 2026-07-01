"""Reads and writes reactivation request data in the database."""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.database.models import ReactivationRequest


# Defines the reactivation request repository class.
class ReactivationRequestRepository:
    """Groups reactivation request repository helper functions."""
    @staticmethod
    # Creates this file data.
    def create(db: Session, request_data: dict) -> ReactivationRequest:
        """Runs create logic."""
        request = ReactivationRequest(**request_data)
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    # Gets data by ID.
    def get_by_id(db: Session, request_id: int) -> Optional[ReactivationRequest]:
        """Returns by ID data."""
        return db.query(ReactivationRequest).filter(ReactivationRequest.id == request_id).first()

    @staticmethod
    # Gets pending for user data.
    def get_pending_for_user(db: Session, user_id: int) -> Optional[ReactivationRequest]:
        """Returns pending for user data."""
        return (
            db.query(ReactivationRequest)
            .filter(ReactivationRequest.user_id == user_id, ReactivationRequest.status == "pending")
            .order_by(ReactivationRequest.requested_at.desc())
            .first()
        )

    @staticmethod
    # Gets for user data.
    def get_for_user(db: Session, user_id: int):
        """Returns for user data."""
        return (
            db.query(ReactivationRequest)
            .filter(ReactivationRequest.user_id == user_id)
            .order_by(ReactivationRequest.requested_at.desc())
            .all()
        )

    @staticmethod
    # Gets pending for admin data.
    def get_pending_for_admin(db: Session, admin_id: int, company_id: int):
        """Returns pending for admin data."""
        return (
            db.query(ReactivationRequest)
            .filter(
                ReactivationRequest.deactivated_by_user_id == admin_id,
                ReactivationRequest.company_id == company_id,
                ReactivationRequest.status == "pending",
            )
            .order_by(ReactivationRequest.requested_at.desc())
            .all()
        )

    @staticmethod
    # Updates status data.
    def update_status(db: Session, request: ReactivationRequest, status: str, reviewer_id: int, reviewer_name: str):
        """Update status records."""
        request.status = status
        request.reviewed_at = datetime.utcnow()
        request.reviewer_id = reviewer_id
        request.reviewer_name = reviewer_name
        request.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(request)
        return request