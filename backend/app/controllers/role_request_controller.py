"""Handles role request requests."""
from app.services.role_request_service import RoleRequestService

# Defines the role request controller class.
class RoleRequestController:
    """Groups role request controller helper functions."""
    @staticmethod
    # Runs submit role request.
    def submit_role_request(requester_email: str, current_password: str, admin_email: str):
        """Runs submit role request logic."""
        return RoleRequestService.create_role_request(requester_email, current_password, admin_email)

    @staticmethod
    # Gets user requests data.
    def get_user_requests(requester_email: str):
        """Returns user requests data."""
        return RoleRequestService.get_user_requests(requester_email)

    @staticmethod
    # Gets pending requests data.
    def get_pending_requests(admin_email: str):
        """Returns pending requests data."""
        return RoleRequestService.get_pending_requests(admin_email)

    @staticmethod
    # Runs approve request.
    def approve_request(request_id: int, admin_email: str):
        """Runs approve request logic."""
        return RoleRequestService.approve_request(request_id, admin_email)

    @staticmethod
    # Runs reject request.
    def reject_request(request_id: int, admin_email: str):
        """Runs reject request logic."""
        return RoleRequestService.reject_request(request_id, admin_email)