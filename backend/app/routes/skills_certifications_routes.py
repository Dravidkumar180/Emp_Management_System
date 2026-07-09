"""Defines API routes for employee skills and certifications."""
from datetime import date, datetime, timedelta
import csv
import io
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    AuditLog,
    Certification,
    Employee,
    EmployeeCertification,
    EmployeeSkill,
    Notification,
    Skill,
    User,
)
from app.utils.auth import get_admin_user, get_current_active_user, get_current_company_id

router = APIRouter()

SKILL_LEVELS = {"Beginner", "Intermediate", "Advanced", "Expert"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


class SkillPayload(BaseModel):
    """Validates skill create and update requests."""

    skill_name: str = Field(..., min_length=1, max_length=120)
    proficiency_level: str = Field(..., min_length=1, max_length=30)
    years_experience: float = Field(0, ge=0)
    is_primary: bool = False

    @validator("skill_name")
    def clean_skill_name(cls, value):
        return value.strip()

    @validator("proficiency_level")
    def validate_level(cls, value):
        cleaned = value.strip()
        if cleaned not in SKILL_LEVELS:
            raise ValueError("Invalid proficiency level")
        return cleaned


class CertificationPayload(BaseModel):
    """Validates certification create and update requests."""

    certification_name: str = Field(..., min_length=1, max_length=160)
    issuing_organization: str = Field(..., min_length=1, max_length=160)
    issue_date: str = Field(..., min_length=1, max_length=20)
    expiry_date: Optional[str] = None
    document_name: Optional[str] = None
    document_type: Optional[str] = None
    document_data: Optional[str] = None

    @validator("certification_name", "issuing_organization")
    def clean_required_text(cls, value):
        return value.strip()

    @validator("expiry_date")
    def empty_expiry_to_none(cls, value):
        return value or None


def parse_date(value: Optional[str]) -> Optional[date]:
    """Parses an ISO date string."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must use YYYY-MM-DD format")


def normalize_company_slug(company_id: int) -> str:
    """Returns the frontend company slug for a numeric company id."""
    return "company-a" if company_id == 1 else "company-b" if company_id == 2 else str(company_id)


def get_employee_for_user(db: Session, user: User) -> Optional[Employee]:
    """Finds the employee row tied to the current user when one exists."""
    return db.query(Employee).filter(
        Employee.company_id == user.company_id,
        func.lower(Employee.email) == user.email.lower(),
    ).first()


def employee_display(db: Session, user: User) -> dict:
    """Builds employee profile text for API responses."""
    employee = get_employee_for_user(db, user)
    return {
        "employee_id": employee.id if employee else None,
        "user_id": user.id,
        "name": employee.name if employee else user.name,
        "email": user.email,
        "department": employee.department if employee else "",
        "role": employee.role if employee else user.role,
        "company_id": normalize_company_slug(user.company_id),
    }


def ensure_admin_scope(current_user: User):
    """Blocks admins that do not belong to a company."""
    if current_user.role != "super_admin" and not current_user.company_id:
        raise HTTPException(status_code=403, detail="No company associated with user")


def create_audit_log(db: Session, request: Request, user: User, company_id: int, action: str, entity_type: str, entity_id: int, entity_name: str, details: str):
    """Writes a skills and certifications audit log entry."""
    db.add(AuditLog(
        user_id=user.id,
        user_name=user.name,
        user_email=user.email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        details=details,
        company_id=company_id,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    ))


def get_or_create_skill(db: Session, company_id: int, name: str) -> Skill:
    """Finds or creates a company skill catalog item."""
    skill = db.query(Skill).filter(
        Skill.company_id == company_id,
        func.lower(Skill.name) == name.lower(),
    ).first()
    if skill:
        return skill
    skill = Skill(company_id=company_id, name=name)
    db.add(skill)
    db.flush()
    return skill


def get_or_create_certification(db: Session, company_id: int, name: str, organization: str) -> Certification:
    """Finds or creates a company certification catalog item."""
    certification = db.query(Certification).filter(
        Certification.company_id == company_id,
        func.lower(Certification.name) == name.lower(),
        func.lower(Certification.issuing_organization) == organization.lower(),
    ).first()
    if certification:
        return certification
    certification = Certification(company_id=company_id, name=name, issuing_organization=organization)
    db.add(certification)
    db.flush()
    return certification


def certification_status(expiry_date: Optional[str]) -> str:
    """Returns Valid, Expiring Soon, or Expired."""
    expiry = parse_date(expiry_date)
    if not expiry:
        return "Valid"
    today = date.today()
    if expiry < today:
        return "Expired"
    if expiry <= today + timedelta(days=30):
        return "Expiring Soon"
    return "Valid"


def serialize_skill(record: EmployeeSkill, skill: Skill) -> dict:
    """Formats an employee skill response."""
    return {
        "id": record.id,
        "skill_id": skill.id,
        "skill_name": skill.name,
        "proficiency_level": record.proficiency_level,
        "years_experience": record.years_experience,
        "is_primary": record.is_primary,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "updated_at": record.updated_at.isoformat() if record.updated_at else None,
    }


def serialize_certification(record: EmployeeCertification, certification: Certification) -> dict:
    """Formats an employee certification response."""
    return {
        "id": record.id,
        "certification_id": certification.id,
        "certification_name": certification.name,
        "issuing_organization": certification.issuing_organization,
        "issue_date": record.issue_date,
        "expiry_date": record.expiry_date,
        "status": certification_status(record.expiry_date),
        "document_name": record.document_name,
        "document_type": record.document_type,
        "document_data": record.document_data,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "updated_at": record.updated_at.isoformat() if record.updated_at else None,
    }


def validate_certification_payload(payload: CertificationPayload):
    """Runs certification date and upload validation."""
    issue = parse_date(payload.issue_date)
    expiry = parse_date(payload.expiry_date)
    if expiry and issue and expiry < issue:
        raise HTTPException(status_code=400, detail="Expiry date cannot be earlier than issue date")

    if payload.document_name:
        lowered = payload.document_name.lower()
        has_valid_extension = any(lowered.endswith(extension) for extension in ALLOWED_DOCUMENT_EXTENSIONS)
        has_valid_type = not payload.document_type or payload.document_type in ALLOWED_DOCUMENT_TYPES
        if not has_valid_extension or not has_valid_type:
            raise HTTPException(status_code=400, detail="Only PDF, PNG, JPG, and JPEG certificate files are supported")


def build_profile_summary(skills: List[dict], certifications: List[dict]) -> dict:
    """Calculates employee profile summary numbers."""
    active_count = len([item for item in certifications if item["status"] in ["Valid", "Expiring Soon"]])
    expired_count = len([item for item in certifications if item["status"] == "Expired"])
    completion = 20
    if skills:
        completion += 25
    if any(item["is_primary"] for item in skills):
        completion += 15
    if certifications:
        completion += 25
    if active_count:
        completion += 15
    return {
        "total_skills": len(skills),
        "primary_skills": len([item for item in skills if item["is_primary"]]),
        "active_certifications": active_count,
        "expired_certifications": expired_count,
        "profile_completion": min(completion, 100),
    }


def check_expiry_notifications(db: Session, user: User, company_id: int, request: Optional[Request] = None) -> List[dict]:
    """Creates notifications and audit logs for expiring or expired certifications."""
    rows = db.query(EmployeeCertification, Certification).join(
        Certification, Certification.id == EmployeeCertification.certification_id
    ).filter(
        EmployeeCertification.company_id == company_id,
        EmployeeCertification.user_id == user.id,
        EmployeeCertification.expiry_date.isnot(None),
    ).all()
    notifications = []
    today = date.today()
    for record, certification in rows:
        expiry = parse_date(record.expiry_date)
        if not expiry or expiry > today + timedelta(days=30):
            continue
        status = "expired" if expiry < today else "expiring"
        title = "Certification Expired" if status == "expired" else "Certification Expiring Soon"
        days = (expiry - today).days
        message = (
            f"Your {certification.name} certification has expired."
            if status == "expired"
            else f"Your {certification.name} certification expires in {days} days."
        )
        seen = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.related_entity_type == f"certification-{status}",
            Notification.related_entity_id == record.id,
        ).first()
        if not seen:
            db.add(Notification(
                user_id=user.id,
                title=title,
                message=message,
                type="error" if status == "expired" else "warning",
                related_entity_type=f"certification-{status}",
                related_entity_id=record.id,
            ))
            if status == "expired":
                exists = db.query(AuditLog).filter(
                    AuditLog.company_id == company_id,
                    AuditLog.action == "Certification Expired",
                    AuditLog.entity_id == record.id,
                    AuditLog.entity_type == "certification",
                ).first()
                if not exists:
                    create_audit_log(
                        db,
                        request,
                        user,
                        company_id,
                        "Certification Expired",
                        "certification",
                        record.id,
                        certification.name,
                        f"{certification.name} expired for {user.name}",
                    )
        notifications.append({"title": title, "message": message, "status": status, "certification_id": record.id})
    db.commit()
    return notifications


@router.get("/skills")
async def get_my_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    rows = db.query(EmployeeSkill, Skill).join(Skill, Skill.id == EmployeeSkill.skill_id).filter(
        EmployeeSkill.company_id == company_id,
        EmployeeSkill.user_id == current_user.id,
    ).order_by(EmployeeSkill.is_primary.desc(), Skill.name.asc()).all()
    return [serialize_skill(record, skill) for record, skill in rows]


@router.post("/skills", status_code=201)
async def create_skill(
    payload: SkillPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    employee = get_employee_for_user(db, current_user)
    skill = get_or_create_skill(db, company_id, payload.skill_name)
    duplicate = db.query(EmployeeSkill).filter(
        EmployeeSkill.company_id == company_id,
        EmployeeSkill.user_id == current_user.id,
        EmployeeSkill.skill_id == skill.id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="This skill already exists for the employee")
    record = EmployeeSkill(
        company_id=company_id,
        user_id=current_user.id,
        employee_id=employee.id if employee else None,
        skill_id=skill.id,
        proficiency_level=payload.proficiency_level,
        years_experience=payload.years_experience,
        is_primary=payload.is_primary,
    )
    db.add(record)
    db.flush()
    create_audit_log(db, request, current_user, company_id, "Skill Added", "skill", record.id, skill.name, f"{current_user.name} added {skill.name}")
    db.commit()
    db.refresh(record)
    return serialize_skill(record, skill)


@router.put("/skills/{skill_record_id}")
async def update_skill(
    skill_record_id: int,
    payload: SkillPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    record = db.query(EmployeeSkill).filter(
        EmployeeSkill.id == skill_record_id,
        EmployeeSkill.company_id == company_id,
        EmployeeSkill.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill = get_or_create_skill(db, company_id, payload.skill_name)
    duplicate = db.query(EmployeeSkill).filter(
        EmployeeSkill.company_id == company_id,
        EmployeeSkill.user_id == current_user.id,
        EmployeeSkill.skill_id == skill.id,
        EmployeeSkill.id != record.id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="This skill already exists for the employee")
    record.skill_id = skill.id
    record.proficiency_level = payload.proficiency_level
    record.years_experience = payload.years_experience
    record.is_primary = payload.is_primary
    create_audit_log(db, request, current_user, company_id, "Skill Updated", "skill", record.id, skill.name, f"{current_user.name} updated {skill.name}")
    db.commit()
    db.refresh(record)
    return serialize_skill(record, skill)


@router.delete("/skills/{skill_record_id}")
async def delete_skill(
    skill_record_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    row = db.query(EmployeeSkill, Skill).join(Skill, Skill.id == EmployeeSkill.skill_id).filter(
        EmployeeSkill.id == skill_record_id,
        EmployeeSkill.company_id == company_id,
        EmployeeSkill.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Skill not found")
    record, skill = row
    create_audit_log(db, request, current_user, company_id, "Skill Deleted", "skill", record.id, skill.name, f"{current_user.name} deleted {skill.name}")
    db.delete(record)
    db.commit()
    return {"success": True}


@router.get("/certifications")
async def get_my_certifications(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    check_expiry_notifications(db, current_user, company_id, request)
    rows = db.query(EmployeeCertification, Certification).join(
        Certification, Certification.id == EmployeeCertification.certification_id
    ).filter(
        EmployeeCertification.company_id == company_id,
        EmployeeCertification.user_id == current_user.id,
    ).order_by(Certification.name.asc()).all()
    return [serialize_certification(record, certification) for record, certification in rows]


@router.post("/certifications", status_code=201)
async def create_certification(
    payload: CertificationPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    validate_certification_payload(payload)
    employee = get_employee_for_user(db, current_user)
    certification = get_or_create_certification(db, company_id, payload.certification_name, payload.issuing_organization)
    duplicate = db.query(EmployeeCertification).filter(
        EmployeeCertification.company_id == company_id,
        EmployeeCertification.user_id == current_user.id,
        EmployeeCertification.certification_id == certification.id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="This certification already exists for the employee")
    record = EmployeeCertification(
        company_id=company_id,
        user_id=current_user.id,
        employee_id=employee.id if employee else None,
        certification_id=certification.id,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        document_name=payload.document_name,
        document_type=payload.document_type,
        document_data=payload.document_data,
    )
    db.add(record)
    db.flush()
    create_audit_log(db, request, current_user, company_id, "Certification Added", "certification", record.id, certification.name, f"{current_user.name} added {certification.name}")
    db.commit()
    db.refresh(record)
    return serialize_certification(record, certification)


@router.put("/certifications/{certification_record_id}")
async def update_certification(
    certification_record_id: int,
    payload: CertificationPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    validate_certification_payload(payload)
    record = db.query(EmployeeCertification).filter(
        EmployeeCertification.id == certification_record_id,
        EmployeeCertification.company_id == company_id,
        EmployeeCertification.user_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Certification not found")
    certification = get_or_create_certification(db, company_id, payload.certification_name, payload.issuing_organization)
    duplicate = db.query(EmployeeCertification).filter(
        EmployeeCertification.company_id == company_id,
        EmployeeCertification.user_id == current_user.id,
        EmployeeCertification.certification_id == certification.id,
        EmployeeCertification.id != record.id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="This certification already exists for the employee")
    record.certification_id = certification.id
    record.issue_date = payload.issue_date
    record.expiry_date = payload.expiry_date
    record.document_name = payload.document_name
    record.document_type = payload.document_type
    record.document_data = payload.document_data
    create_audit_log(db, request, current_user, company_id, "Certification Updated", "certification", record.id, certification.name, f"{current_user.name} updated {certification.name}")
    db.commit()
    db.refresh(record)
    return serialize_certification(record, certification)


@router.delete("/certifications/{certification_record_id}")
async def delete_certification(
    certification_record_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    row = db.query(EmployeeCertification, Certification).join(
        Certification, Certification.id == EmployeeCertification.certification_id
    ).filter(
        EmployeeCertification.id == certification_record_id,
        EmployeeCertification.company_id == company_id,
        EmployeeCertification.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Certification not found")
    record, certification = row
    create_audit_log(db, request, current_user, company_id, "Certification Deleted", "certification", record.id, certification.name, f"{current_user.name} deleted {certification.name}")
    db.delete(record)
    db.commit()
    return {"success": True}


@router.get("/certifications/expiry-notifications")
async def get_certification_expiry_notifications(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    return check_expiry_notifications(db, current_user, company_id, request)


@router.get("/profile/competency")
async def get_my_competency_profile(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    company_id: int = Depends(get_current_company_id),
):
    skills = await get_my_skills(db, current_user, company_id)
    certifications = await get_my_certifications(request, db, current_user, company_id)
    return {
        "employee": employee_display(db, current_user),
        "summary": build_profile_summary(skills, certifications),
        "skills": skills,
        "certifications": certifications,
    }


def admin_competency_rows(db: Session, company_id: int, filters: dict) -> List[dict]:
    """Builds admin competency rows for the current company."""
    users = db.query(User).filter(User.company_id == company_id, User.role == "user").order_by(User.name.asc()).all()
    rows = []
    for employee_user in users:
        profile = employee_display(db, employee_user)
        skill_rows = db.query(EmployeeSkill, Skill).join(Skill, Skill.id == EmployeeSkill.skill_id).filter(
            EmployeeSkill.company_id == company_id,
            EmployeeSkill.user_id == employee_user.id,
        ).all()
        cert_rows = db.query(EmployeeCertification, Certification).join(
            Certification, Certification.id == EmployeeCertification.certification_id
        ).filter(
            EmployeeCertification.company_id == company_id,
            EmployeeCertification.user_id == employee_user.id,
        ).all()
        skills = [serialize_skill(record, skill) for record, skill in skill_rows]
        certifications = [serialize_certification(record, cert) for record, cert in cert_rows]
        if filters["employee"] and filters["employee"].lower() not in profile["name"].lower() and filters["employee"].lower() not in profile["email"].lower():
            continue
        if filters["skill"] and not any(filters["skill"].lower() in item["skill_name"].lower() for item in skills):
            continue
        if filters["skill_level"] and not any(item["proficiency_level"] == filters["skill_level"] for item in skills):
            continue
        if filters["min_experience"] is not None and not any(item["years_experience"] >= filters["min_experience"] for item in skills):
            continue
        if filters["certification"] and not any(filters["certification"].lower() in item["certification_name"].lower() for item in certifications):
            continue
        if filters["status"] and not any(item["status"] == filters["status"] for item in certifications):
            continue
        rows.append({
            "employee": profile,
            "summary": build_profile_summary(skills, certifications),
            "skills": skills,
            "certifications": certifications,
        })
    return rows


@router.get("/admin/skills")
async def get_admin_skills(
    skill: Optional[str] = Query(None),
    employee: Optional[str] = Query(None),
    skill_level: Optional[str] = Query(None),
    min_experience: Optional[float] = Query(None),
    certification: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
):
    ensure_admin_scope(current_user)
    rows = admin_competency_rows(db, company_id, {
        "skill": skill,
        "employee": employee,
        "skill_level": skill_level,
        "min_experience": min_experience,
        "certification": certification,
        "status": status,
    })
    return {"rows": rows}


@router.get("/admin/certifications")
async def get_admin_certifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
):
    ensure_admin_scope(current_user)
    rows = db.query(EmployeeCertification, Certification, User).join(
        Certification, Certification.id == EmployeeCertification.certification_id
    ).join(User, User.id == EmployeeCertification.user_id).filter(
        EmployeeCertification.company_id == company_id,
    ).all()
    return [
        {
            **serialize_certification(record, certification),
            "employee": employee_display(db, user),
        }
        for record, certification, user in rows
    ]


@router.get("/admin/reports")
async def export_admin_report(
    skill: Optional[str] = Query(None),
    employee: Optional[str] = Query(None),
    skill_level: Optional[str] = Query(None),
    min_experience: Optional[float] = Query(None),
    certification: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    format: str = Query("csv"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
    company_id: int = Depends(get_current_company_id),
):
    ensure_admin_scope(current_user)
    if format not in ["csv", "excel", "pdf"]:
        raise HTTPException(status_code=400, detail="Report format must be csv, excel, or pdf")
    rows = admin_competency_rows(db, company_id, {
        "skill": skill,
        "employee": employee,
        "skill_level": skill_level,
        "min_experience": min_experience,
        "certification": certification,
        "status": status,
    })
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Employee", "Email", "Department", "Skills", "Primary Skills", "Certifications", "Active Certifications", "Expired Certifications"])
    for row in rows:
        writer.writerow([
            row["employee"]["name"],
            row["employee"]["email"],
            row["employee"]["department"],
            "; ".join(f"{item['skill_name']} ({item['proficiency_level']}, {item['years_experience']} yrs)" for item in row["skills"]),
            "; ".join(item["skill_name"] for item in row["skills"] if item["is_primary"]),
            "; ".join(f"{item['certification_name']} ({item['status']})" for item in row["certifications"]),
            row["summary"]["active_certifications"],
            row["summary"]["expired_certifications"],
        ])
    output.seek(0)
    extension = "csv" if format in ["csv", "excel"] else "pdf"
    media_type = "text/csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=competency-report.{extension}"},
    )
