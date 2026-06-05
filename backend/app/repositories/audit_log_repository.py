from sqlalchemy.orm import Session
from app.database.models import AuditLog
from typing import List, Optional, Dict
from datetime import datetime

class AuditLogRepository:
    
    @staticmethod
    def create(db: Session, log_data: Dict) -> AuditLog:
        """Create a new audit log entry"""
        audit_log = AuditLog(
            user_id=log_data.get("user_id"),
            user_name=log_data.get("user_name"),
            user_email=log_data.get("user_email"),
            action=log_data.get("action"),
            entity_type=log_data.get("entity_type"),
            entity_id=log_data.get("entity_id"),
            entity_name=log_data.get("entity_name"),
            details=log_data.get("details"),
            ip_address=log_data.get("ip_address"),
            user_agent=log_data.get("user_agent"),
            company_id=log_data.get("company_id"),
            old_value=log_data.get("old_value"),
            new_value=log_data.get("new_value"),
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log
    
    @staticmethod
    def get_all(db: Session, company_id: int = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """Get all audit logs with optional company filter"""
        query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
        if company_id is not None:
            query = query.filter(AuditLog.company_id == company_id)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_recent(db: Session, limit: int = 10, company_id: int = None) -> List[AuditLog]:
        """Get recent audit logs"""
        query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
        if company_id is not None:
            query = query.filter(AuditLog.company_id == company_id)
        return query.limit(limit).all()
    
    @staticmethod
    def get_by_action(db: Session, action: str, company_id: int = None) -> List[AuditLog]:
        """Get audit logs by action type"""
        query = db.query(AuditLog).filter(AuditLog.action == action).order_by(AuditLog.created_at.desc())
        if company_id is not None:
            query = query.filter(AuditLog.company_id == company_id)
        return query.all()
