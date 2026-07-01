"""Shared backend helper functions."""
from fastapi import Request
from app.services.audit_log_service import AuditLogService
from app.database.database import SessionLocal

# Helps with log action.
def log_action(
    user_id: int,
    user_name: str,
    user_email: str,
    action: str,
    entity_type: str,
    entity_id: int = None,
    entity_name: str = None,
    details: str = None,
    request: Request = None,
    old_value: str = None,
    new_value: str = None,
    company_id: int = None
):
    """Helper function to log actions"""
    
    ip_address = None
    user_agent = None
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
    
    log_data = {
        "user_id": user_id,
        "user_name": user_name,
        "user_email": user_email,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "entity_name": entity_name,
        "details": details,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "old_value": old_value,
        "new_value": new_value,
        "company_id": company_id
    }
    
    AuditLogService.create_log(log_data)