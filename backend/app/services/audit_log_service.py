"""Runs business logic for audit log."""
from app.repositories.audit_log_repository import AuditLogRepository
from app.database.database import SessionLocal
from typing import List, Dict, Optional

# Defines the audit log service class.
class AuditLogService:
    """Groups audit log service helper functions."""
    
    @staticmethod
    # Creates log data.
    def create_log(log_data: Dict) -> Dict:
        """Create an audit log entry"""
        db = SessionLocal()
        try:
            log = AuditLogRepository.create(db, log_data)
            return {
                "id": log.id,
                "user_name": log.user_name,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_name": log.entity_name,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
        finally:
            db.close()
    
    @staticmethod
    # Gets all logs data.
    def get_all_logs(company_id: int = None, skip: int = 0, limit: int = 100) -> List[Dict]:
        """Get all audit logs"""
        db = SessionLocal()
        try:
            logs = AuditLogRepository.get_all(db, company_id, skip, limit)
            return [{
                "id": log.id,
                "user_name": log.user_name,
                "user_email": log.user_email,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "entity_name": log.entity_name,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None
            } for log in logs]
        finally:
            db.close()
    
    @staticmethod
    # Gets recent logs data.
    def get_recent_logs(limit: int = 10, company_id: int = None) -> List[Dict]:
        """Get recent logs for notifications"""
        db = SessionLocal()
        try:
            logs = AuditLogRepository.get_recent(db, limit, company_id)
            return [{
                "id": log.id,
                "user_name": log.user_name,
                "action": log.action,
                "entity_name": log.entity_name,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "is_new": True
            } for log in logs]
        finally:
            db.close()