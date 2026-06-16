from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from datetime import datetime
from app.database.database import Base


class Company(Base):
    """Company Model for Multi-Tenancy"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)
    website = Column(String(100), nullable=True)
    subscription_plan = Column(String(50), default="basic")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Employee(Base):
    """Employee Model"""
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), index=True, nullable=False)
    username = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    website = Column(String(100), nullable=True)
    company_name = Column(String(100), nullable=True)
    department = Column(String(50), nullable=False)
    status = Column(String(20), default="Active")
    role = Column(String(50), nullable=False)
    location = Column(String(50), nullable=True)
    join_date = Column(String(20), nullable=True)
    avatar = Column(String(5), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Department(Base):
    """Department Model"""
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(200), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    """User Model for Authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # super_admin, admin, user
    is_active = Column(Boolean, default=True)
    deactivated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    deactivated_by_name = Column(String(100), nullable=True)
    deactivated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserInvitation(Base):
    """Company-scoped user invitation"""
    __tablename__ = "user_invitations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)# Which company they join
    email = Column(String(100), index=True, nullable=False)  # Email being invited
    role = Column(String(20), default="user") # Role to assign (user/admin)
    token = Column(String(255), unique=True, index=True, nullable=False)  # Unique invitation token
    status = Column(String(20), default="pending")  # pending, accepted, revoked
    invited_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    accepted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RoleChangeRequest(Base):
    """Role Change Request Model"""
    __tablename__ = "role_change_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requester_email = Column(String(100), nullable=False)
    admin_email = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ReactivationRequest(Base):
    """Reactivation Request Model"""
    __tablename__ = "reactivation_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requester_email = Column(String(100), nullable=False)
    requester_name = Column(String(100), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    deactivated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    deactivated_by_name = Column(String(100), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_name = Column(String(100), nullable=False)
    user_email = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    entity_name = Column(String(200), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)


class Notification(Base):
    """Notification Model for Real-time Alerts"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, success, warning, error
    is_read = Column(Boolean, default=False)
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)


# Helper function to get all table names (for debugging)
def get_all_tables():
    return [
        "companies",
        "employees", 
        "departments",
        "users",
        "user_invitations",
        "role_change_requests",
        "reactivation_requests",
        "audit_logs",
        "notifications"
    ]
