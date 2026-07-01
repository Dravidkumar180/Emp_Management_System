"""Defines API routes for audit log."""
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from app.controllers.audit_log_controller import AuditLogController
from app.services.audit_log_service import AuditLogService
from app.utils.auth import get_current_company_id, get_current_user
from app.database.models import User

router = APIRouter()


# Defines the audit log create class.
class AuditLogCreate(BaseModel):
    """Groups audit log create helper functions."""
    action: str = Field(..., min_length=1, max_length=100)
    entity_type: str = Field(..., min_length=1, max_length=50)
    entity_id: Optional[int] = None
    entity_name: Optional[str] = None
    details: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None


@router.get("/audit-logs")
# Gets audit logs data.
async def get_audit_logs(
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum records to return"),
    action: Optional[str] = Query(None, description="Filter by action"),
    current_user: User = Depends(get_current_user),
    company_id: int = Depends(get_current_company_id)
):
    """
    Get all audit logs for user's company with optional filters
    """
    logs = AuditLogController.get_all_logs(company_id, skip, limit)
    
    # Apply action filter if provided
    if action:
        logs = [log for log in logs if action.lower() in log.get("action", "").lower()]
    
    return logs


@router.post("/audit-logs", status_code=201)
# Creates audit log data.
async def create_audit_log(
    log: AuditLogCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    company_id: int = Depends(get_current_company_id)
):
    """
    Create an audit log entry for UI actions that are handled client-side.
    """
    try:
        return AuditLogService.create_log({
            "user_id": current_user.id,
            "user_name": current_user.name,
            "user_email": current_user.email,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "entity_name": log.entity_name,
            "details": log.details,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "company_id": company_id,
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to create audit log: {exc}")


@router.get("/audit-logs/recent")
# Gets recent audit logs data.
async def get_recent_audit_logs(
    limit: int = Query(10, description="Number of recent logs"),
    current_user: User = Depends(get_current_user),
    company_id: int = Depends(get_current_company_id)
):
    """
    Get recent audit logs for notifications
    """
    return AuditLogController.get_recent_logs(limit, company_id)


@router.get("/audit-logs/actions")
# Gets unique actions data.
async def get_unique_actions(company_id: int = Depends(get_current_company_id)):
    """
    Get all unique action types for filtering
    """
    logs = AuditLogController.get_all_logs(company_id)
    actions = list(set([log.get("action") for log in logs if log.get("action")]))
    return {"actions": sorted(actions)}