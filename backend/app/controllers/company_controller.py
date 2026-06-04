from fastapi import HTTPException
from app.services.company_service import CompanyService

class CompanyController:
    
    @staticmethod
    def get_all_companies():
        companies = CompanyService.get_all_companies()
        if not companies:
            raise HTTPException(404, "No companies found")
        return companies
    
    @staticmethod
    def get_user_company(user_id: int):
        company = CompanyService.get_user_company(user_id)
        if not company:
            raise HTTPException(404, "Company not found")
        return company
    
    @staticmethod
    def create_company(company_data: dict):
        if not company_data.get("name"):
            raise HTTPException(400, "Company name is required")
        return CompanyService.create_company(company_data)
    
    @staticmethod
    def update_company(company_id: int, update_data: dict):
        company = CompanyService.update_company(company_id, update_data)
        if not company:
            raise HTTPException(404, "Company not found")
        return company
    
    @staticmethod
    def delete_company(company_id: int):
        success = CompanyService.delete_company(company_id)
        if not success:
            raise HTTPException(404, "Company not found")
        return {"message": "Company deleted successfully"}
    
    @staticmethod
    def get_company_stats(company_id: int):
        return CompanyService.get_company_stats(company_id)