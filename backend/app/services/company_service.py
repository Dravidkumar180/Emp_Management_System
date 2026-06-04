from app.repositories.company_repository import CompanyRepository
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.database.database import SessionLocal
from typing import List, Dict, Optional

class CompanyService:
    
    @staticmethod
    def get_all_companies() -> List[Dict]:
        db = SessionLocal()
        try:
            companies = CompanyRepository.get_all(db)
            return [{
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "address": c.address,
                "website": c.website,
                "subscription_plan": c.subscription_plan,
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat() if c.created_at else None
            } for c in companies]
        finally:
            db.close()
    
    @staticmethod
    def get_user_company(user_id: int) -> Optional[Dict]:
        db = SessionLocal()
        try:
            company = CompanyRepository.get_user_companies(db, user_id)
            if not company:
                return None
            return {
                "id": company.id,
                "name": company.name,
                "email": company.email,
                "phone": company.phone,
                "address": company.address,
                "website": company.website,
                "subscription_plan": company.subscription_plan
            }
        finally:
            db.close()
    
    @staticmethod
    def create_company(company_data: dict) -> Dict:
        db = SessionLocal()
        try:
            company_create = CompanyCreate(**company_data)
            new_company = CompanyRepository.create(db, company_create)
            return {
                "id": new_company.id,
                "name": new_company.name,
                "email": new_company.email,
                "subscription_plan": new_company.subscription_plan
            }
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
            return {
                "id": updated.id,
                "name": updated.name,
                "email": updated.email,
                "subscription_plan": updated.subscription_plan
            }
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