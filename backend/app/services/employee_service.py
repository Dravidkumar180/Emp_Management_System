import httpx
from typing import List, Dict, Optional

class EmployeeService:
    """Service layer for employee operations"""
    
    JSONPLACEHOLDER_URL = "https://jsonplaceholder.typicode.com/users"
    
    @staticmethod
    async def fetch_from_jsonplaceholder() -> List[Dict]:
        """Fetch employees from JSONPlaceholder"""
        async with httpx.AsyncClient() as client:
            response = await client.get(EmployeeService.JSONPLACEHOLDER_URL)
            if response.status_code == 200:
                return response.json()
            return []
    
    @staticmethod
    async def get_all_employees() -> List[Dict]:
        """Get all employees from JSONPlaceholder"""
        users = await EmployeeService.fetch_from_jsonplaceholder()
        
        # Transform data to match our employee structure
        departments = ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations', 'IT', 'Product']
        statuses = ['Active', 'Active', 'Remote', 'On Leave', 'Active', 'Inactive', 'Active', 'Remote']
        roles = ['Software Engineer', 'HR Manager', 'Marketing Lead', 'Sales Executive', 'Financial Analyst', 'Operations Manager', 'UI/UX Designer', 'Product Manager']
        locations = ['New York', 'London', 'Tokyo', 'Sydney', 'Toronto', 'Berlin', 'Dubai', 'Singapore']
        
        employees = []
        for user in users:
            index = user["id"] % len(departments)
            employees.append({
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "username": user["username"],
                "phone": user["phone"],
                "website": user.get("website", ""),
                "company": user["company"]["name"],
                "department": departments[index],
                "status": statuses[index],
                "role": roles[index],
                "location": locations[index],
                "join_date": f"202{user['id'] % 3}-{String((user['id'] % 12) + 1).zfill(2)}-{String((user['id'] % 28) + 1).zfill(2)}",
                "avatar": user["name"][0].upper()
            })
        return employees
    
    @staticmethod
    async def get_employee_by_id(employee_id: int) -> Optional[Dict]:
        """Get employee by ID from JSONPlaceholder"""
        users = await EmployeeService.fetch_from_jsonplaceholder()
        for user in users:
            if user["id"] == employee_id:
                # Transform single user
                departments = ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations', 'IT', 'Product']
                statuses = ['Active', 'Active', 'Remote', 'On Leave', 'Active', 'Inactive', 'Active', 'Remote']
                roles = ['Software Engineer', 'HR Manager', 'Marketing Lead', 'Sales Executive', 'Financial Analyst', 'Operations Manager', 'UI/UX Designer', 'Product Manager']
                locations = ['New York', 'London', 'Tokyo', 'Sydney', 'Toronto', 'Berlin', 'Dubai', 'Singapore']
                
                index = user["id"] % len(departments)
                return {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "username": user["username"],
                    "phone": user["phone"],
                    "website": user.get("website", ""),
                    "company": user["company"]["name"],
                    "department": departments[index],
                    "status": statuses[index],
                    "role": roles[index],
                    "location": locations[index],
                    "join_date": f"202{user['id'] % 3}-{str((user['id'] % 12) + 1).zfill(2)}-{str((user['id'] % 28) + 1).zfill(2)}",
                    "avatar": user["name"][0].upper()
                }
        return None