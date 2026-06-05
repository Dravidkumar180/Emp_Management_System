from app.repositories.company_repository import CompanyRepository
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.database.database import SessionLocal
from typing import List, Dict, Optional

class CompanyService:

    @staticmethod
    def _to_dict(company) -> Dict:
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
            "created_at": company.created_at.isoformat() if company.created_at else None,
            "updated_at": company.updated_at.isoformat() if company.updated_at else None
        }
    
    @staticmethod
    def get_all_companies() -> List[Dict]:
        db = SessionLocal()
        try:
            companies = CompanyRepository.get_all(db)
            return [CompanyService._to_dict(c) for c in companies]
        finally:
            db.close()
    
    @staticmethod
    def get_user_company(user_id: int) -> Optional[Dict]:
        db = SessionLocal()
        try:
            company = CompanyRepository.get_user_company(db, user_id)
            if not company:
                return None
            return CompanyService._to_dict(company)
        finally:
            db.close()
    
    @staticmethod
    def create_company(company_data: dict) -> Dict:
        db = SessionLocal()
        try:
            company_create = CompanyCreate(**company_data)
            new_company = CompanyRepository.create(db, company_create)
            return CompanyService._to_dict(new_company)
        finally:
            db.close()
    
    @staticmethod
    def update_company(company_id: int, update_data: dict) -> Optional[Dict]:
        db = SessionLocal()
        try:
            company_update = CompanyUpdate(**update_data)
            updated = CompanyRepository.update(db, company_id, company_update)
            if not updated:
                return None
            return CompanyService._to_dict(updated)
        finally:
            db.close()
    
    @staticmethod
    def delete_company(company_id: int) -> bool:
        db = SessionLocal()
        try:
            return CompanyRepository.delete(db, company_id)
        finally:
            db.close()
    
    @staticmethod
    def get_company_stats(company_id: int) -> Dict:
        db = SessionLocal()
        try:
            return CompanyRepository.get_company_stats(db, company_id)
        finally:
            db.close()
