"""Login device and session management routes."""
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import LoginDeviceSession, User
from app.utils.audit_helper import log_action
from app.utils.auth import get_admin_user, get_current_active_user, get_current_company_id

router = APIRouter()
SESSION_TIMEOUT_HOURS = 24


class SessionCreate(BaseModel):
    """Create session payload."""
    user_id: int
    user_name: str
    user_email: str
    company_id: int
    browser: Optional[str] = None
    device_name: Optional[str] = None
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    trusted: bool = False


class SessionRename(BaseModel):
    """Rename device payload."""
    device_name: str


class BulkSessionAction(BaseModel):
    """Bulk session payload."""
    session_ids: List[int]


def serialize_session(session: LoginDeviceSession) -> dict:
    """Convert session model to API response."""
    return {
        "id": session.id,
        "session_identifier": session.session_identifier,
        "company_id": session.company_id,
        "user_id": session.user_id,
        "user_name": session.user_name,
        "user_email": session.user_email,
        "browser": session.browser,
        "device_name": session.device_name,
        "device_info": session.device_info,
        "ip_address": session.ip_address,
        "location": session.location,
        "login_time": session.login_time.isoformat() if session.login_time else None,
        "last_activity_time": session.last_activity_time.isoformat() if session.last_activity_time else None,
        "status": session.status,
        "trusted": session.trusted,
        "termination_reason": session.termination_reason,
        "revoked_by_name": session.revoked_by_name,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }


def request_ip(request: Request) -> str:
    """Get request IP."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "Unknown"


def expire_inactive_sessions(db: Session, company_id: int = None) -> None:
    """Expire inactive sessions."""
    cutoff = datetime.utcnow() - timedelta(hours=SESSION_TIMEOUT_HOURS)
    query = db.query(LoginDeviceSession).filter(
        LoginDeviceSession.status == "Active",
        LoginDeviceSession.last_activity_time < cutoff,
    )
    if company_id:
        query = query.filter(LoginDeviceSession.company_id == company_id)
    expired = query.all()
    for session in expired:
        session.status = "Session Expired"
        session.termination_reason = "Session Expired"
    if expired:
        db.commit()
        for session in expired:
            log_action(
                session.user_id, session.user_name, session.user_email,
                "Session Expired", "login_device", session.id, session.device_name,
                f"Session {session.session_identifier} expired due to inactivity",
                company_id=session.company_id,
            )


def scoped_session(db: Session, session_id: int, current_user: User, company_id: int, admin: bool = False) -> LoginDeviceSession:
    """Load a session inside the caller scope."""
    query = db.query(LoginDeviceSession).filter(
        LoginDeviceSession.id == session_id,
        LoginDeviceSession.company_id == company_id,
    )
    if not admin:
        query = query.filter(LoginDeviceSession.user_id == current_user.id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def ensure_revocable(session: LoginDeviceSession) -> None:
    """Prevent duplicate revoke/logout operations."""
    if session.status in ["Revoked", "Session Expired"]:
        raise HTTPException(status_code=400, detail=f"Session is already {session.status}")


@router.post("/login-devices/sessions", status_code=201)
async def create_session(session_data: SessionCreate, request: Request, db: Session = Depends(get_db)):
    """Create a new login session record."""
    now = datetime.utcnow()
    session = LoginDeviceSession(
        session_identifier=f"sess_{uuid4().hex[:16]}",
        company_id=session_data.company_id,
        user_id=session_data.user_id,
        user_name=session_data.user_name,
        user_email=session_data.user_email,
        browser=session_data.browser or request.headers.get("user-agent", "Unknown Browser")[:120],
        device_name=session_data.device_name or "Current Device",
        device_info=session_data.device_info or request.headers.get("user-agent", "Unknown Device")[:250],
        ip_address=session_data.ip_address or request_ip(request),
        location=session_data.location or "Unknown Location",
        login_time=now,
        last_activity_time=now,
        status="Active",
        trusted=session_data.trusted,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return serialize_session(session)


@router.get("/login-devices/me")
async def my_sessions(
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """List current user's sessions."""
    expire_inactive_sessions(db, company_id)
    sessions = db.query(LoginDeviceSession).filter(
        LoginDeviceSession.company_id == company_id,
        LoginDeviceSession.user_id == current_user.id,
    ).order_by(LoginDeviceSession.login_time.desc()).all()
    return [serialize_session(session) for session in sessions]


@router.get("/login-devices/company")
async def company_sessions(
    search: Optional[str] = Query(None),
    browser: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """List company sessions for admin monitoring."""
    expire_inactive_sessions(db, company_id)
    query = db.query(LoginDeviceSession).filter(LoginDeviceSession.company_id == company_id)
    if search:
        like = f"%{search.lower()}%"
        query = query.filter(
            (LoginDeviceSession.user_name.ilike(like)) |
            (LoginDeviceSession.user_email.ilike(like)) |
            (LoginDeviceSession.device_name.ilike(like))
        )
    if browser:
        query = query.filter(LoginDeviceSession.browser.ilike(f"%{browser}%"))
    if status:
        query = query.filter(LoginDeviceSession.status == status)
    sessions = query.order_by(LoginDeviceSession.login_time.desc()).all()
    return [serialize_session(session) for session in sessions]


@router.post("/login-devices/activity")
async def update_activity(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Update last activity for the current session and validate status."""
    session_identifier = request.headers.get("x-session-id")
    if not session_identifier:
        return {"status": "missing-session"}
    session = db.query(LoginDeviceSession).filter(
        LoginDeviceSession.session_identifier == session_identifier,
        LoginDeviceSession.company_id == company_id,
        LoginDeviceSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    expire_inactive_sessions(db, company_id)
    db.refresh(session)
    if session.status != "Active":
        raise HTTPException(status_code=401, detail=f"Session {session.status}")
    session.last_activity_time = datetime.utcnow()
    db.commit()
    return serialize_session(session)


@router.patch("/login-devices/{session_id}/rename")
async def rename_device(
    session_id: int,
    payload: SessionRename,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Rename a user's own trusted device."""
    session = scoped_session(db, session_id, current_user, company_id)
    old_name = session.device_name
    duplicate = db.query(LoginDeviceSession).filter(
        LoginDeviceSession.company_id == company_id,
        LoginDeviceSession.user_id == current_user.id,
        LoginDeviceSession.device_name == payload.device_name,
        LoginDeviceSession.id != session.id,
        LoginDeviceSession.trusted == True,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Trusted device name already exists")
    session.device_name = payload.device_name.strip()
    session.trusted = True
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    log_action(
        current_user.id, current_user.name, current_user.email,
        "Trusted Device Renamed", "login_device", session.id, session.device_name,
        f"Renamed device from {old_name} to {session.device_name}",
        request=request, company_id=company_id,
    )
    return serialize_session(session)


@router.post("/login-devices/{session_id}/remove-trusted")
async def remove_trusted_device(
    session_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Remove trusted indicator from own device."""
    session = scoped_session(db, session_id, current_user, company_id)
    session.trusted = False
    db.commit()
    log_action(
        current_user.id, current_user.name, current_user.email,
        "Trusted Device Removed", "login_device", session.id, session.device_name,
        f"Removed trusted device {session.device_name}",
        request=request, company_id=company_id,
    )
    return serialize_session(session)


@router.post("/login-devices/{session_id}/logout")
async def logout_session(
    session_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Logout a selected own session."""
    session = scoped_session(db, session_id, current_user, company_id)
    ensure_revocable(session)
    session.status = "Logged Out"
    session.termination_reason = "User Logout"
    session.updated_at = datetime.utcnow()
    db.commit()
    log_action(
        current_user.id, current_user.name, current_user.email,
        "User Logout", "login_device", session.id, session.device_name,
        f"Logged out session {session.session_identifier}",
        request=request, company_id=company_id,
    )
    return serialize_session(session)


@router.post("/login-devices/logout-others")
async def logout_other_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Logout all sessions except current."""
    current_session_identifier = request.headers.get("x-session-id")
    sessions = db.query(LoginDeviceSession).filter(
        LoginDeviceSession.company_id == company_id,
        LoginDeviceSession.user_id == current_user.id,
        LoginDeviceSession.status == "Active",
        LoginDeviceSession.session_identifier != current_session_identifier,
    ).all()
    for session in sessions:
        session.status = "Logged Out"
        session.termination_reason = "User Logout"
    db.commit()
    for session in sessions:
        log_action(
            current_user.id, current_user.name, current_user.email,
            "User Logout", "login_device", session.id, session.device_name,
            f"Logged out session {session.session_identifier}",
            request=request, company_id=company_id,
        )
    return {"updated": len(sessions)}


@router.post("/login-devices/logout-all")
async def logout_all_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Logout all own sessions."""
    sessions = db.query(LoginDeviceSession).filter(
        LoginDeviceSession.company_id == company_id,
        LoginDeviceSession.user_id == current_user.id,
        LoginDeviceSession.status == "Active",
    ).all()
    for session in sessions:
        session.status = "Logged Out"
        session.termination_reason = "User Logout"
    db.commit()
    for session in sessions:
        log_action(
            current_user.id, current_user.name, current_user.email,
            "User Logout", "login_device", session.id, session.device_name,
            f"Logged out session {session.session_identifier}",
            request=request, company_id=company_id,
        )
    return {"updated": len(sessions)}


@router.post("/login-devices/{session_id}/force-logout")
async def force_logout_session(
    session_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Admin force logout a company session."""
    session = scoped_session(db, session_id, current_user, company_id, admin=True)
    ensure_revocable(session)
    session.status = "Logged Out"
    session.termination_reason = "Force Logout by Admin"
    session.revoked_by_user_id = current_user.id
    session.revoked_by_name = current_user.name
    session.updated_at = datetime.utcnow()
    db.commit()
    log_action(
        current_user.id, current_user.name, current_user.email,
        "Force Logout Initiated", "login_device", session.id, session.device_name,
        f"Force logout initiated for {session.user_email}",
        request=request, company_id=company_id,
    )
    return serialize_session(session)


@router.post("/login-devices/{session_id}/revoke")
async def revoke_session(
    session_id: int,
    request: Request,
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Admin revoke a company session."""
    session = scoped_session(db, session_id, current_user, company_id, admin=True)
    ensure_revocable(session)
    session.status = "Revoked"
    session.termination_reason = "Revoked by Admin"
    session.revoked_by_user_id = current_user.id
    session.revoked_by_name = current_user.name
    session.updated_at = datetime.utcnow()
    db.commit()
    log_action(
        current_user.id, current_user.name, current_user.email,
        "Session Revoked", "login_device", session.id, session.device_name,
        f"Revoked session {session.session_identifier} for {session.user_email}",
        request=request, company_id=company_id,
    )
    return serialize_session(session)


@router.post("/login-devices/bulk-revoke")
async def bulk_revoke_sessions(
    payload: BulkSessionAction,
    request: Request,
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Admin bulk revoke company sessions."""
    sessions = db.query(LoginDeviceSession).filter(
        LoginDeviceSession.company_id == company_id,
        LoginDeviceSession.id.in_(payload.session_ids),
        LoginDeviceSession.status == "Active",
    ).all()
    for session in sessions:
        session.status = "Revoked"
        session.termination_reason = "Revoked by Admin"
        session.revoked_by_user_id = current_user.id
        session.revoked_by_name = current_user.name
    db.commit()
    for session in sessions:
        log_action(
            current_user.id, current_user.name, current_user.email,
            "Session Revoked", "login_device", session.id, session.device_name,
            f"Revoked session {session.session_identifier} for {session.user_email}",
            request=request, company_id=company_id,
        )
    log_action(
        current_user.id, current_user.name, current_user.email,
        "Force Logout Initiated", "login_device", None, "Bulk revoke",
        f"Revoked {len(sessions)} sessions",
        request=request, company_id=company_id,
    )
    return {"updated": len(sessions)}
