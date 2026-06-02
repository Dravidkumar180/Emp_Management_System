from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.database.database import Base

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    username = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    website = Column(String(100), nullable=True)
    company = Column(String(100), nullable=True)
    department = Column(String(50), nullable=False)
    status = Column(String(20), default="Active")
    role = Column(String(50), nullable=False)
    location = Column(String(50), nullable=True)
    join_date = Column(String(20), nullable=True)
    avatar = Column(String(5), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# NEW: User Model for Authentication
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Store hashed password
    role = Column(String(20), default="user")  # admin, user, manager
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RoleChangeRequest(Base):
    __tablename__ = "role_change_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, nullable=False)
    requester_email = Column(String(100), nullable=False)
    admin_email = Column(String(100), nullable=False)
    status = Column(String(20), default="pending")
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_id = Column(Integer, nullable=True)

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)