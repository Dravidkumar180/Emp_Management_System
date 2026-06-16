from typing import Dict, List, Optional

from fastapi import HTTPException, Request

from app.database.database import SessionLocal
from app.database.models import ReactivationRequest, User
from app.repositories.reactivation_request_repository import ReactivationRequestRepository
from app.repositories.user_repository import UserRepository
from app.utils.audit_helper import log_action


def _serialize_request(request: ReactivationRequest) -> Dict:
    return {
        "id": request.id,
        "user_id": request.user_id,
        "requester_email": request.requester_email,
        "requester_name": request.requester_name,
        "company_id": request.company_id,
        "deactivated_by_user_id": request.deactivated_by_user_id,
        "deactivated_by_name": request.deactivated_by_name,
        "message": request.message,
        "status": request.status,
        "requested_at": request.requested_at.isoformat() if request.requested_at else None,
        "reviewed_at": request.reviewed_at.isoformat() if request.reviewed_at else None,
        "reviewer_id": request.reviewer_id,
        "reviewer_name": request.reviewer_name,
    }


class ReactivationRequestService:
    @staticmethod
    def submit_request(user: User, message: Optional[str], request: Optional[Request] = None) -> Dict:
        if user.is_active:
            raise HTTPException(status_code=400, detail="Account is already active")
        if not user.company_id:
            raise HTTPException(status_code=403, detail="User does not belong to a company")

        db = SessionLocal()
        try:
            existing = ReactivationRequestRepository.get_pending_for_user(db, user.id)
            if existing:
                return _serialize_request(existing)

            reactivation_request = ReactivationRequestRepository.create(
                db,
                {
                    "user_id": user.id,
                    "requester_email": user.email,
                    "requester_name": user.name,
                    "company_id": user.company_id,
                    "deactivated_by_user_id": user.deactivated_by_user_id,
                    "deactivated_by_name": user.deactivated_by_name,
                    "message": (message or "").strip() or None,
                    "status": "pending",
                },
            )

            log_action(
                user_id=user.id,
                user_name=user.name,
                user_email=user.email,
                action="Reactivation Request Submitted",
                entity_type="reactivation_request",
                entity_id=reactivation_request.id,
                entity_name=user.email,
                details=f"Reactivation request submitted by {user.email}",
                request=request,
                company_id=user.company_id,
            )
            return _serialize_request(reactivation_request)
        finally:
            db.close()

    @staticmethod
    def get_my_requests(user: User) -> List[Dict]:
        db = SessionLocal()
        try:
            requests = ReactivationRequestRepository.get_for_user(db, user.id)
            return [_serialize_request(request) for request in requests]
        finally:
            db.close()

    @staticmethod
    def get_pending_for_admin(admin_user: User) -> List[Dict]:
        if not admin_user.company_id:
            raise HTTPException(status_code=403, detail="Admin must belong to a company")
        db = SessionLocal()
        try:
            requests = ReactivationRequestRepository.get_pending_for_admin(
                db, admin_user.id, admin_user.company_id
            )
            return [_serialize_request(request) for request in requests]
        finally:
            db.close()

    @staticmethod
    def approve_request(request_id: int, admin_user: User, request: Optional[Request] = None) -> Dict:
        db = SessionLocal()
        try:
            reactivation_request = ReactivationRequestRepository.get_by_id(db, request_id)
            if not reactivation_request:
                raise HTTPException(status_code=404, detail="Reactivation request not found")
            if reactivation_request.status != "pending":
                raise HTTPException(status_code=400, detail="Only pending requests can be reviewed")
            if reactivation_request.deactivated_by_user_id != admin_user.id:
                raise HTTPException(status_code=403, detail="Only the deactivating admin can approve this request")
            if reactivation_request.company_id != admin_user.company_id:
                raise HTTPException(status_code=403, detail="Request belongs to another company")

            user = UserRepository.activate_in_company(
                db, reactivation_request.user_id, admin_user.company_id
            )
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            updated_request = ReactivationRequestRepository.update_status(
                db, reactivation_request, "approved", admin_user.id, admin_user.name
            )
            log_action(
                user_id=admin_user.id,
                user_name=admin_user.name,
                user_email=admin_user.email,
                action="Reactivation Approved",
                entity_type="reactivation_request",
                entity_id=updated_request.id,
                entity_name=user.email,
                details=f"Reactivation approved for {user.email}",
                request=request,
                company_id=admin_user.company_id,
            )
            log_action(
                user_id=admin_user.id,
                user_name=admin_user.name,
                user_email=admin_user.email,
                action="User Activated",
                entity_type="user",
                entity_id=user.id,
                entity_name=user.email,
                details=f"User {user.email} was activated",
                request=request,
                company_id=admin_user.company_id,
            )
            return _serialize_request(updated_request)
        finally:
            db.close()

    @staticmethod
    def reject_request(request_id: int, admin_user: User, request: Optional[Request] = None) -> Dict:
        db = SessionLocal()
        try:
            reactivation_request = ReactivationRequestRepository.get_by_id(db, request_id)
            if not reactivation_request:
                raise HTTPException(status_code=404, detail="Reactivation request not found")
            if reactivation_request.status != "pending":
                raise HTTPException(status_code=400, detail="Only pending requests can be reviewed")
            if reactivation_request.deactivated_by_user_id != admin_user.id:
                raise HTTPException(status_code=403, detail="Only the deactivating admin can reject this request")
            if reactivation_request.company_id != admin_user.company_id:
                raise HTTPException(status_code=403, detail="Request belongs to another company")

            updated_request = ReactivationRequestRepository.update_status(
                db, reactivation_request, "rejected", admin_user.id, admin_user.name
            )
            log_action(
                user_id=admin_user.id,
                user_name=admin_user.name,
                user_email=admin_user.email,
                action="Reactivation Rejected",
                entity_type="reactivation_request",
                entity_id=updated_request.id,
                entity_name=updated_request.requester_email,
                details=f"Reactivation rejected for {updated_request.requester_email}",
                request=request,
                company_id=admin_user.company_id,
            )
            return _serialize_request(updated_request)
        finally:
            db.close()
