"""Handles audit log requests."""
from fastapi import HTTPException
from app.services.audit_log_service import AuditLogService
from typing import List, Dict

# Defines the audit log controller class.
class AuditLogController:
    """Groups audit log controller helper functions."""
    
    @staticmethod
    # Gets all logs data.
    def get_all_logs(company_id: int = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all audit logs"""
        return AuditLogService.get_all_logs(company_id, skip, limit)
    
    @staticmethod
    # Gets recent logs data.
    def get_recent_logs(limit: int = 10, company_id: int = None) -> List[Dict]:
        """Get recent audit logs"""
        return AuditLogService.get_recent_logs(limit, company_id)