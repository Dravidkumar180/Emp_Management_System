from fastapi import HTTPException
from app.services.audit_log_service import AuditLogService
from typing import List, Dict

class AuditLogController:
    
    @staticmethod
    def get_all_logs(company_id: int = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all audit logs"""
        return AuditLogService.get_all_logs(company_id, skip, limit)
    
    @staticmethod
    def get_recent_logs(limit: int = 10, company_id: int = None) -> List[Dict]:
        """Get recent audit logs"""
        return AuditLogService.get_recent_logs(limit, company_id)