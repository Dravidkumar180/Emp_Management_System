from sqlalchemy.orm import Session
from app.database.models import RoleChangeRequest
from typing import Optional, List
from datetime import datetime

class RoleRequestRepository:
    @staticmethod
    def create(db: Session, requester_id: int, requester_email: str, admin_email: str) -> RoleChangeRequest:
        role_request = RoleChangeRequest(
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
    def get_by_id(db: Session, request_id: int) -> Optional[RoleChangeRequest]:
        return db.query(RoleChangeRequest).filter(RoleChangeRequest.id == request_id).first()

    @staticmethod
    def get_by_requester_email(db: Session, requester_email: str):
        normalized_requester_email = requester_email.strip().lower()
        return db.query(RoleChangeRequest).filter(
            RoleChangeRequest.requester_email == normalized_requester_email
        ).order_by(RoleChangeRequest.requested_at.desc()).all()

    @staticmethod
    def get_pending_by_admin_email(db: Session, admin_email: str):
        normalized_admin_email = admin_email.strip().lower()
        return db.query(RoleChangeRequest).filter(
            RoleChangeRequest.admin_email == normalized_admin_email,
            RoleChangeRequest.status == 'pending'
        ).order_by(RoleChangeRequest.requested_at.desc()).all()

    @staticmethod
    def update_status(db: Session, request_obj: RoleChangeRequest, status: str, reviewer_id: Optional[int] = None) -> RoleChangeRequest:
        request_obj.status = status
        request_obj.reviewed_at = datetime.utcnow()
        request_obj.reviewer_id = reviewer_id
        db.commit()
        db.refresh(request_obj)
        return request_obj
