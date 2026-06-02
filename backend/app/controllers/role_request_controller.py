from app.services.role_request_service import RoleRequestService

class RoleRequestController:
    @staticmethod
    def submit_role_request(requester_email: str, current_password: str, admin_email: str):
        return RoleRequestService.create_role_request(requester_email, current_password, admin_email)

    @staticmethod
    def get_user_requests(requester_email: str):
        return RoleRequestService.get_user_requests(requester_email)

    @staticmethod
    def get_pending_requests(admin_email: str):
        return RoleRequestService.get_pending_requests(admin_email)

    @staticmethod
    def approve_request(request_id: int, admin_email: str):
        return RoleRequestService.approve_request(request_id, admin_email)

    @staticmethod
    def reject_request(request_id: int, admin_email: str):
        return RoleRequestService.reject_request(request_id, admin_email)
