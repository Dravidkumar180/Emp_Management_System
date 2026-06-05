from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from sqlalchemy.orm import Session
from app.controllers.company_controller import CompanyController
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.utils.auth import get_current_user, get_super_admin, create_access_token
from app.database.database import SessionLocal
from app.database.models import User
from app.repositories.company_repository import CompanyRepository
from app.utils.audit_helper import log_action

router = APIRouter()


# ========== SUPER ADMIN ENDPOINTS ==========

@router.get("/companies", response_model=List[CompanyResponse])
async def get_all_companies(current_user: User = Depends(get_super_admin)):
    """
    Get all companies in the system
    - **Super Admin only**
    - Returns list of all companies with their details
    """
    return CompanyController.get_all_companies()


@router.get("/companies/{company_id}")
async def get_company_by_id(
    company_id: int,
    current_user: User = Depends(get_super_admin)
):
    """
    Get company by ID
    - **Super Admin only**
    - Returns detailed company information
    """
    db = SessionLocal()
    try:
        company = CompanyRepository.get_by_id(db, company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get company stats
        stats = CompanyRepository.get_company_stats(db, company_id)
        
        return {
            "id": company.id,
            "name": company.name,
            "slug": company.slug,
            "email": company.email,
            "phone": company.phone,
            "address": company.address,
            "website": company.website,
            "subscription_plan": company.subscription_plan,
            "is_active": company.is_active,
            "stats": stats,
            "created_at": company.created_at,
            "updated_at": company.updated_at
        }
    finally:
        db.close()


@router.get("/companies/{company_id}/stats")
async def get_company_stats_by_id(
    company_id: int,
    current_user: User = Depends(get_super_admin)
):
    """
    Get statistics for a specific company
    - **Super Admin only**
    - Returns employee counts, department stats, etc.
    """
    db = SessionLocal()
    try:
        company = CompanyRepository.get_by_id(db, company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return CompanyRepository.get_company_stats(db, company_id)
    finally:
        db.close()


@router.post("/companies", response_model=CompanyResponse)
async def create_company(
    company: CompanyCreate,
    request: Request,
    current_user: User = Depends(get_super_admin)
):
    """
    Create a new company
    - **Super Admin only**
    - Creates a new company in the system
    """
    created_company = CompanyController.create_company(company.dict())
    log_action(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        action="Company Created",
        entity_type="company",
        entity_id=created_company.get("id"),
        entity_name=created_company.get("name"),
        details=f"Company {created_company.get('name')} was created",
        request=request,
        company_id=current_user.company_id,
        new_value=str(created_company)
    )
    return created_company


@router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int,
    company: CompanyUpdate,
    request: Request,
    current_user: User = Depends(get_super_admin)
):
    """
    Update an existing company
    - **Super Admin only**
    - Updates company information
    """
    old_company = None
    db = SessionLocal()
    try:
        existing = CompanyRepository.get_by_id(db, company_id)
        if existing:
            old_company = {
                "id": existing.id,
                "name": existing.name,
                "email": existing.email,
                "phone": existing.phone,
                "address": existing.address,
                "website": existing.website,
                "subscription_plan": existing.subscription_plan,
                "is_active": existing.is_active
            }
    finally:
        db.close()

    updated_company = CompanyController.update_company(company_id, company.dict())
    log_action(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        action="Company Updated",
        entity_type="company",
        entity_id=company_id,
        entity_name=updated_company.get("name"),
        details=f"Company {updated_company.get('name')} was updated",
        request=request,
        company_id=current_user.company_id,
        old_value=str(old_company) if old_company else None,
        new_value=str(updated_company)
    )
    return updated_company


@router.delete("/companies/{company_id}")
async def delete_company(
    company_id: int,
    request: Request,
    current_user: User = Depends(get_super_admin)
):
    """
    Delete a company
    - **Super Admin only**
    - Permanently removes company and all associated data
    """
    deleted_name = f"Company {company_id}"
    db = SessionLocal()
    try:
        existing = CompanyRepository.get_by_id(db, company_id)
        if existing:
            deleted_name = existing.name
    finally:
        db.close()

    result = CompanyController.delete_company(company_id)
    log_action(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        action="Company Deleted",
        entity_type="company",
        entity_id=company_id,
        entity_name=deleted_name,
        details=f"Company {deleted_name} was deleted",
        request=request,
        company_id=current_user.company_id
    )
    return result


@router.post("/companies/{company_id}/activate")
async def activate_company(
    company_id: int,
    request: Request,
    current_user: User = Depends(get_super_admin)
):
    """
    Activate a company
    - **Super Admin only**
    - Sets company status to active
    """
    db = SessionLocal()
    try:
        company = CompanyRepository.activate(db, company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        log_action(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            action="Company Activated",
            entity_type="company",
            entity_id=company.id,
            entity_name=company.name,
            details=f"Company {company.name} was activated",
            request=request,
            company_id=current_user.company_id
        )
        
        return {"message": f"Company {company.name} activated successfully"}
    finally:
        db.close()


@router.post("/companies/{company_id}/deactivate")
async def deactivate_company(
    company_id: int,
    request: Request,
    current_user: User = Depends(get_super_admin)
):
    """
    Deactivate a company
    - **Super Admin only**
    - Sets company status to inactive
    """
    db = SessionLocal()
    try:
        company = CompanyRepository.deactivate(db, company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        log_action(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            action="Company Deactivated",
            entity_type="company",
            entity_id=company.id,
            entity_name=company.name,
            details=f"Company {company.name} was deactivated",
            request=request,
            company_id=current_user.company_id
        )
        
        return {"message": f"Company {company.name} deactivated successfully"}
    finally:
        db.close()


# ========== AUTHENTICATED USER ENDPOINTS ==========

@router.get("/companies/my-company")
async def get_my_company(current_user: User = Depends(get_current_user)):
    """
    Get current user's company
    - Any authenticated user
    - Returns company details for the user's associated company
    """
    db = SessionLocal()
    try:
        company = CompanyRepository.get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        stats = CompanyRepository.get_company_stats(db, company.id)
        
        return {
            "id": company.id,
            "name": company.name,
            "slug": company.slug,
            "subscription_plan": company.subscription_plan,
            "stats": stats
        }
    finally:
        db.close()


@router.get("/companies/stats")
async def get_company_stats(current_user: User = Depends(get_current_user)):
    """
    Get statistics for current user's company
    - Any authenticated user
    - Returns stats for the user's associated company
    """
    db = SessionLocal()
    try:
        company = CompanyRepository.get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return CompanyRepository.get_company_stats(db, company.id)
    finally:
        db.close()


@router.post("/companies/switch/{company_id}")
async def switch_company(
    company_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Switch current user's active company
    - Any authenticated user can switch to any active company
    - Returns new access token with updated company_id
    """
    db = SessionLocal()
    try:
        # Check if company exists
        company = CompanyRepository.get_by_id(db, company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if company is active
        if not company.is_active:
            raise HTTPException(status_code=400, detail="Company is not active")
        
        # Get user from database
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user's company_id
        user.company_id = company_id
        db.commit()
        db.refresh(user)
        
        # Create new access token with updated company info
        new_token = create_access_token({
            "sub": user.email,
            "role": user.role,
            "company_id": company_id
        })
        
        # Get updated stats for the new company
        stats = CompanyRepository.get_company_stats(db, company_id)
        
        return {
            "message": f"Successfully switched to {company.name}",
            "access_token": new_token,
            "token_type": "bearer",
            "company": {
                "id": company.id,
                "name": company.name,
                "slug": company.slug,
                "subscription_plan": company.subscription_plan,
                "stats": stats
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error switching company: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        db.close()


@router.get("/companies/available")
async def get_available_companies(current_user: User = Depends(get_current_user)):
    """
    Get all companies user can switch to
    - Any authenticated user
    - Returns list of active companies user has access to
    """
    db = SessionLocal()
    try:
        # Return all active companies
        companies = CompanyRepository.get_all_active(db)
        
        # Get current user's company ID
        current_company = CompanyRepository.get_user_company(db, current_user.id)
        
        return [{
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "subscription_plan": c.subscription_plan,
            "is_current": current_company and current_company.id == c.id
        } for c in companies]
    finally:
        db.close()
