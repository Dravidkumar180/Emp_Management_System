"""Reads and writes reinstatement request data in the database."""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.database.models import ReinstatementRequest


# Defines the reinstatement request repository class.
class ReinstatementRequestRepository:
    """Database access for reinstatement requests."""

    @staticmethod
    # Creates this file data.
    def create(db: Session, request_data: dict) -> ReinstatementRequest:
        request = ReinstatementRequest(**request_data)
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    # Gets data by ID.
    def get_by_id(db: Session, request_id: int) -> Optional[ReinstatementRequest]:
        return db.query(ReinstatementRequest).filter(ReinstatementRequest.id == request_id).first()

    @staticmethod
    # Gets pending for user data.
    def get_pending_for_user(db: Session, user_id: int) -> Optional[ReinstatementRequest]:
        return (
            db.query(ReinstatementRequest)
            .filter(ReinstatementRequest.user_id == user_id, ReinstatementRequest.status == "pending")
            .order_by(ReinstatementRequest.requested_at.desc())
            .first()
        )

    @staticmethod
    # Gets for user data.
    def get_for_user(db: Session, user_id: int):
        return (
            db.query(ReinstatementRequest)
            .filter(ReinstatementRequest.user_id == user_id)
            .order_by(ReinstatementRequest.requested_at.desc())
            .all()
        )

    @staticmethod
    # Gets data by company.
    def get_by_company(db: Session, company_id: int):
        return (
            db.query(ReinstatementRequest)
            .filter(ReinstatementRequest.company_id == company_id)
            .order_by(ReinstatementRequest.requested_at.desc())
            .all()
        )

    @staticmethod
    # Updates status data.
    def update_status(db: Session, request: ReinstatementRequest, status: str, reviewer_id: int, reviewer_name: str):
        request.status = status
        request.reviewed_at = datetime.utcnow()
        request.reviewer_id = reviewer_id
        request.reviewer_name = reviewer_name
        request.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(request)
        return request