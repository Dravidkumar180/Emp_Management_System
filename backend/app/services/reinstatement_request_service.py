"""Runs business logic for reinstatement request."""
from typing import Dict, List, Optional

from fastapi import HTTPException, Request

from app.database.database import SessionLocal
from app.database.models import ReinstatementRequest, User
from app.repositories.reinstatement_request_repository import ReinstatementRequestRepository
from app.repositories.user_repository import UserRepository
from app.utils.audit_helper import log_action


# Runs serialize request.
def _serialize_request(request: ReinstatementRequest) -> Dict:
    return {
        "id": request.id,
        "user_id": request.user_id,
        "requester_email": request.requester_email,
        "requester_name": request.requester_name,
        "company_id": request.company_id,
        "suspended_by_user_id": request.suspended_by_user_id,
        "suspended_by_name": request.suspended_by_name,
        "message": request.message,
        "status": request.status,
        "requested_at": request.requested_at.isoformat() if request.requested_at else None,
        "reviewed_at": request.reviewed_at.isoformat() if request.reviewed_at else None,
        "reviewer_id": request.reviewer_id,
        "reviewer_name": request.reviewer_name,
    }


# Defines the reinstatement request service class.
class ReinstatementRequestService:
    """Business rules for reinstatement requests."""

    @staticmethod
    # Runs submit request.
    def submit_request(user: User, message: Optional[str], request: Optional[Request] = None) -> Dict:
        if not user.is_suspended:
            raise HTTPException(status_code=400, detail="Account is not suspended")
        if not user.company_id:
            raise HTTPException(status_code=403, detail="User does not belong to a company")

        db = SessionLocal()
        try:
            existing = ReinstatementRequestRepository.get_pending_for_user(db, user.id)
            if existing:
                return _serialize_request(existing)

            reinstatement_request = ReinstatementRequestRepository.create(
                db,
                {
                    "user_id": user.id,
                    "requester_email": user.email,
                    "requester_name": user.name,
                    "company_id": user.company_id,
                    "suspended_by_user_id": user.suspended_by_user_id,
                    "suspended_by_name": user.suspended_by_name,
                    "message": (message or "").strip() or None,
                    "status": "pending",
                },
            )

            log_action(
                user_id=user.id,
                user_name=user.name,
                user_email=user.email,
                action="Reinstatement Request Submitted",
                entity_type="reinstatement_request",
                entity_id=reinstatement_request.id,
                entity_name=user.email,
                details=f"Reinstatement request submitted by {user.email}",
                request=request,
                company_id=user.company_id,
            )
            return _serialize_request(reinstatement_request)
        finally:
            db.close()

    @staticmethod
    # Gets my requests data.
    def get_my_requests(user: User) -> List[Dict]:
        db = SessionLocal()
        try:
            requests = ReinstatementRequestRepository.get_for_user(db, user.id)
            return [_serialize_request(request) for request in requests]
        finally:
            db.close()

    @staticmethod
    # Gets company requests data.
    def get_company_requests(admin_user: User) -> List[Dict]:
        if not admin_user.company_id:
            raise HTTPException(status_code=403, detail="Admin must belong to a company")
        db = SessionLocal()
        try:
            requests = ReinstatementRequestRepository.get_by_company(db, admin_user.company_id)
            return [_serialize_request(request) for request in requests]
        finally:
            db.close()

    @staticmethod
    # Runs approve request.
    def approve_request(request_id: int, admin_user: User, request: Optional[Request] = None) -> Dict:
        db = SessionLocal()
        try:
            reinstatement_request = ReinstatementRequestRepository.get_by_id(db, request_id)
            if not reinstatement_request:
                raise HTTPException(status_code=404, detail="Reinstatement request not found")
            if reinstatement_request.status != "pending":
                raise HTTPException(status_code=400, detail="Only pending requests can be reviewed")
            if reinstatement_request.company_id != admin_user.company_id:
                raise HTTPException(status_code=403, detail="Request belongs to another company")

            user = UserRepository.reinstate_in_company(
                db, reinstatement_request.user_id, admin_user.company_id
            )
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            updated_request = ReinstatementRequestRepository.update_status(
                db, reinstatement_request, "approved", admin_user.id, admin_user.name
            )
            log_action(
                user_id=admin_user.id,
                user_name=admin_user.name,
                user_email=admin_user.email,
                action="Reinstatement Approved",
                entity_type="reinstatement_request",
                entity_id=updated_request.id,
                entity_name=user.email,
                details=f"Reinstatement approved for {user.email}",
                request=request,
                company_id=admin_user.company_id,
            )
            return _serialize_request(updated_request)
        finally:
            db.close()

    @staticmethod
    # Runs reject request.
    def reject_request(request_id: int, admin_user: User, request: Optional[Request] = None) -> Dict:
        db = SessionLocal()
        try:
            reinstatement_request = ReinstatementRequestRepository.get_by_id(db, request_id)
            if not reinstatement_request:
                raise HTTPException(status_code=404, detail="Reinstatement request not found")
            if reinstatement_request.status != "pending":
                raise HTTPException(status_code=400, detail="Only pending requests can be reviewed")
            if reinstatement_request.company_id != admin_user.company_id:
                raise HTTPException(status_code=403, detail="Request belongs to another company")

            updated_request = ReinstatementRequestRepository.update_status(
                db, reinstatement_request, "rejected", admin_user.id, admin_user.name
            )
            log_action(
                user_id=admin_user.id,
                user_name=admin_user.name,
                user_email=admin_user.email,
                action="Reinstatement Rejected",
                entity_type="reinstatement_request",
                entity_id=updated_request.id,
                entity_name=updated_request.requester_email,
                details=f"Reinstatement rejected for {updated_request.requester_email}",
                request=request,
                company_id=admin_user.company_id,
            )
            return _serialize_request(updated_request)
        finally:
            db.close()