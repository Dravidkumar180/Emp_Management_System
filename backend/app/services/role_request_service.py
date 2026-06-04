from app.repositories.user_repository import UserRepository
from app.repositories.role_request_repository import RoleRequestRepository
from app.utils.auth import verify_password
from app.database.database import SessionLocal
from datetime import datetime

class RoleRequestService:
    @staticmethod
    def create_role_request(requester_email: str, current_password: str, admin_email: str):
        db = SessionLocal()
        try:
            requester = UserRepository.get_by_email(db, requester_email)
            if not requester:
                raise ValueError('Requester not found')

            if requester.role != 'user':
                raise ValueError('Only users can request a role change')

            if not verify_password(current_password, requester.password):
                raise ValueError('Invalid current password')

            normalized_admin_email = admin_email.strip().lower()
            admin_user = UserRepository.get_by_email(db, normalized_admin_email)
            if not admin_user:
                raise ValueError('Admin reviewer does not exist in the database')
            if admin_user.role != 'admin':
                raise ValueError('This reviewer exists but is not an admin. Please choose a valid admin reviewer.')

            role_request = RoleRequestRepository.create(
                db,
                requester_id=requester.id,
                requester_email=requester.email,
                admin_email=admin_user.email
            )

            return role_request
        finally:
            db.close()

    @staticmethod
    def get_user_requests(requester_email: str):
        db = SessionLocal()
        try:
            normalized_requester_email = requester_email.strip().lower()
            user = UserRepository.get_by_email(db, normalized_requester_email)
            if not user:
                raise ValueError('Requester not found')
            return RoleRequestRepository.get_by_requester_email(db, user.email)
        finally:
            db.close()

    @staticmethod
    def get_pending_requests(admin_email: str):
        db = SessionLocal()
        try:
            normalized_admin_email = admin_email.strip().lower()
            admin_user = UserRepository.get_by_email(db, normalized_admin_email)
            if not admin_user or admin_user.role != 'admin':
                raise ValueError('Unauthorized access')

            return RoleRequestRepository.get_pending_by_admin_email(db, admin_user.email)
        finally:
            db.close()

    @staticmethod
    def approve_request(request_id: int, admin_email: str):
        db = SessionLocal()
        try:
            normalized_admin_email = admin_email.strip().lower()
            admin_user = UserRepository.get_by_email(db, normalized_admin_email)
            if not admin_user or admin_user.role != 'admin':
                raise ValueError('Unauthorized access')

            role_request = RoleRequestRepository.get_by_id(db, request_id)
            if not role_request:
                raise ValueError('Role request not found')

            if role_request.admin_email.strip().lower() != normalized_admin_email:
                raise ValueError('This request is not assigned to you')

            if role_request.status != 'pending':
                raise ValueError('Request has already been reviewed')

            requester = UserRepository.get_by_id(db, role_request.requester_id)
            if not requester:
                raise ValueError('Requester not found')

            requester.role = 'user'
            updated_request = RoleRequestRepository.update_status(db, role_request, 'approved', reviewer_id=admin_user.id)
            return updated_request
        finally:
            db.close()

    @staticmethod
    def reject_request(request_id: int, admin_email: str):
        db = SessionLocal()
        try:
            normalized_admin_email = admin_email.strip().lower()
            admin_user = UserRepository.get_by_email(db, normalized_admin_email)
            if not admin_user or admin_user.role != 'admin':
                raise ValueError('Unauthorized access')

            role_request = RoleRequestRepository.get_by_id(db, request_id)
            if not role_request:
                raise ValueError('Role request not found')

            if role_request.admin_email.strip().lower() != normalized_admin_email:
                raise ValueError('This request is not assigned to you')

            if role_request.status != 'pending':
                raise ValueError('Request has already been reviewed')

            requester = UserRepository.get_by_id(db, role_request.requester_id)
            if not requester:
                raise ValueError('Requester not found')

            requester.role = 'user'
            updated_request = RoleRequestRepository.update_status(db, role_request, 'rejected', reviewer_id=admin_user.id)
            return updated_request
        finally:
            db.close()
