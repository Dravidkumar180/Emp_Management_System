from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional

from app.database.models import User
from app.services.reactivation_request_service import ReactivationRequestService
from app.utils.auth import get_admin_user, get_current_user


router = APIRouter()


class ReactivationRequestCreate(BaseModel):
    message: Optional[str] = None


@router.post("/auth/reactivation-request")
async def submit_reactivation_request(
    data: ReactivationRequestCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    return ReactivationRequestService.submit_request(current_user, data.message, request)


@router.get("/auth/reactivation-requests/me")
async def list_my_reactivation_requests(current_user: User = Depends(get_current_user)):
    return ReactivationRequestService.get_my_requests(current_user)


@router.get("/auth/reactivation-requests/pending")
async def list_pending_reactivation_requests(current_user: User = Depends(get_admin_user)):
    return ReactivationRequestService.get_pending_for_admin(current_user)


@router.post("/auth/reactivation-requests/{request_id}/approve")
async def approve_reactivation_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    return ReactivationRequestService.approve_request(request_id, current_user, request)


@router.post("/auth/reactivation-requests/{request_id}/reject")
async def reject_reactivation_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    return ReactivationRequestService.reject_request(request_id, current_user, request)
