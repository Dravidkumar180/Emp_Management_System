"""Handles company requests."""
from fastapi import HTTPException
from app.services.company_service import CompanyService

# Defines the company controller class.
class CompanyController:
    """Groups company controller helper functions."""
    
    @staticmethod
    # Gets all companies data.
    def get_all_companies():
        """Returns all companies data."""
        companies = CompanyService.get_all_companies()
        if not companies:
            raise HTTPException(404, "No companies found")
        return companies
    
    @staticmethod
    # Gets user company data.
    def get_user_company(user_id: int):
        """Returns user company data."""
        company = CompanyService.get_user_company(user_id)
        if not company:
            raise HTTPException(404, "Company not found")
        return company
    
    @staticmethod
    # Creates company data.
    def create_company(company_data: dict):
        """Create company records."""
        if not company_data.get("name"):
            raise HTTPException(400, "Company name is required")
        return CompanyService.create_company(company_data)
    
    @staticmethod
    # Updates company data.
    def update_company(company_id: int, update_data: dict):
        """Update company records."""
        company = CompanyService.update_company(company_id, update_data)
        if not company:
            raise HTTPException(404, "Company not found")
        return company
    
    @staticmethod
    # Deletes company data.
    def delete_company(company_id: int):
        """Delete company records."""
        success = CompanyService.delete_company(company_id)
        if not success:
            raise HTTPException(404, "Company not found")
        return {"message": "Company deleted successfully"}
    
    @staticmethod
    # Gets company stats data.
    def get_company_stats(company_id: int):
        """Returns company stats data."""
        return CompanyService.get_company_stats(company_id)