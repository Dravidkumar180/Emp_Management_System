from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.controllers.role_request_controller import RoleRequestController
from app.utils.auth import get_current_active_user
from app.database.models import User

router = APIRouter()

class RoleRequestCreateBody(BaseModel):
    current_password: str
    admin_email: EmailStr

class RoleRequestActionResponse(BaseModel):
    message: str
    request_id: int
    status: str

@router.post('/auth/role-request')
async def create_role_request(data: RoleRequestCreateBody, current_user: User = Depends(get_current_active_user)):
    requester_email = current_user.email
    try:
        request_obj = RoleRequestController.submit_role_request(requester_email, data.current_password, data.admin_email)
        return {
            'id': request_obj.id,
            'requester_id': request_obj.requester_id,
            'requester_email': request_obj.requester_email,
            'admin_email': request_obj.admin_email,
            'status': request_obj.status,
            'requested_at': request_obj.requested_at,
            'reviewed_at': request_obj.reviewed_at,
            'reviewer_id': request_obj.reviewer_id
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        print(f'Create role request error: {exc}')
        raise HTTPException(status_code=500, detail='Unable to create role request')

@router.get('/auth/role-requests')
async def list_user_role_requests(current_user: User = Depends(get_current_active_user)):
    requester_email = current_user.email
    try:
        requests = RoleRequestController.get_user_requests(requester_email)
        return [
            {
                'id': request.id,
                'requester_id': request.requester_id,
                'requester_email': request.requester_email,
                'admin_email': request.admin_email,
                'status': request.status,
                'requested_at': request.requested_at,
                'reviewed_at': request.reviewed_at,
                'reviewer_id': request.reviewer_id
            }
            for request in requests
        ]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        print(f'List user role requests error: {exc}')
        raise HTTPException(status_code=500, detail='Unable to fetch user requests')


@router.get('/auth/role-requests/pending')
async def list_pending_role_requests(current_user: User = Depends(get_current_active_user)):
    admin_email = current_user.email
    try:
        requests = RoleRequestController.get_pending_requests(admin_email)
        return [
            {
                'id': request.id,
                'requester_id': request.requester_id,
                'requester_email': request.requester_email,
                'admin_email': request.admin_email,
                'status': request.status,
                'requested_at': request.requested_at,
                'reviewed_at': request.reviewed_at,
                'reviewer_id': request.reviewer_id
            }
            for request in requests
        ]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        print(f'List pending role requests error: {exc}')
        raise HTTPException(status_code=500, detail='Unable to fetch pending requests')

@router.post('/auth/role-requests/{request_id}/approve')
async def approve_role_request(request_id: int, current_user: User = Depends(get_current_active_user)):
    admin_email = current_user.email
    try:
        request_obj = RoleRequestController.approve_request(request_id, admin_email)
        return {
            'message': 'Role request approved',
            'request_id': request_obj.id,
            'status': request_obj.status
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        print(f'Approve role request error: {exc}')
        raise HTTPException(status_code=500, detail='Unable to approve request')

@router.post('/auth/role-requests/{request_id}/reject')
async def reject_role_request(request_id: int, current_user: User = Depends(get_current_active_user)):
    admin_email = current_user.email
    try:
        request_obj = RoleRequestController.reject_request(request_id, admin_email)
        return {
            'message': 'Role request rejected',
            'request_id': request_obj.id,
            'status': request_obj.status
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        print(f'Reject role request error: {exc}')
        raise HTTPException(status_code=500, detail='Unable to reject request')
