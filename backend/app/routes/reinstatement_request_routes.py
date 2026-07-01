"""Defines API routes for reinstatement request."""
from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.database.models import User
from app.services.reinstatement_request_service import ReinstatementRequestService
from app.utils.auth import get_admin_user, get_current_user


router = APIRouter()


# Defines the reinstatement request create class.
class ReinstatementRequestCreate(BaseModel):
    message: Optional[str] = None


@router.post("/auth/reinstatement-request")
# Runs submit reinstatement request.
async def submit_reinstatement_request(
    data: ReinstatementRequestCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    return ReinstatementRequestService.submit_request(current_user, data.message, request)


@router.get("/auth/reinstatement-requests/me")
# Runs list my reinstatement requests.
async def list_my_reinstatement_requests(current_user: User = Depends(get_current_user)):
    return ReinstatementRequestService.get_my_requests(current_user)


@router.get("/auth/reinstatement-requests")
# Runs list company reinstatement requests.
async def list_company_reinstatement_requests(current_user: User = Depends(get_admin_user)):
    return ReinstatementRequestService.get_company_requests(current_user)


@router.post("/auth/reinstatement-requests/{request_id}/approve")
# Runs approve reinstatement request.
async def approve_reinstatement_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    return ReinstatementRequestService.approve_request(request_id, current_user, request)


@router.post("/auth/reinstatement-requests/{request_id}/reject")
# Runs reject reinstatement request.
async def reject_reinstatement_request(
    request_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
):
    return ReinstatementRequestService.reject_request(request_id, current_user, request)