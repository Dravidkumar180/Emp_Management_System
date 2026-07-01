"""Stores sample data for local development."""
from typing import List, Dict, Optional

# Mock employee data
mock_employees = [
    {
        "id": 1,
        "name": "Leanne Graham",
        "email": "Sincere@april.biz",
        "username": "Bret",
        "phone": "1-770-736-8031 x56442",
        "website": "hildegard.org",
        "company": "Romaguera-Crona",
        "department": "Engineering",
        "status": "Active",
        "role": "UI/UX Designer",
        "join_date": "2021-05-21",
        "location": "New York",
        "avatar": "L"
    },
    {
        "id": 2,
        "name": "Ervin Howell",
        "email": "Shanna@melissa.tv",
        "username": "Antonette",
        "phone": "010-692-6593 x09125",
        "website": "anastasia.net",
        "company": "Deckow-Crist",
        "department": "Product",
        "status": "Active",
        "role": "Product Manager",
        "join_date": "2021-06-15",
        "location": "London",
        "avatar": "E"
    },
    {
        "id": 3,
        "name": "Clementine Bauch",
        "email": "Nathan@yesenia.net",
        "username": "Samantha",
        "phone": "1-463-123-4447",
        "website": "ramiro.info",
        "company": "Romaguera-Jacobson",
        "department": "Human Resources",
        "status": "Active",
        "role": "HR Manager",
        "join_date": "2021-07-10",
        "location": "Tokyo",
        "avatar": "C"
    },
    {
        "id": 4,
        "name": "Patricia Lebsack",
        "email": "Julianne.OConner@kory.org",
        "username": "Karianne",
        "phone": "493-170-9623 x156",
        "website": "kale.biz",
        "company": "Robel-Corkery",
        "department": "Marketing",
        "status": "Remote",
        "role": "Marketing Lead",
        "join_date": "2021-08-05",
        "location": "Sydney",
        "avatar": "P"
    },
    {
        "id": 5,
        "name": "Chelsey Dietrich",
        "email": "Lucio_Hettinger@annie.ca",
        "username": "Kamren",
        "phone": "(254)954-1289",
        "website": "demarco.info",
        "company": "Keebler LLC",
        "department": "Data",
        "status": "Active",
        "role": "Data Scientist",
        "join_date": "2021-09-20",
        "location": "Toronto",
        "avatar": "C"
    },
    {
        "id": 6,
        "name": "Mrs. Dennis Schulist",
        "email": "Karley_Dach@jasper.info",
        "username": "Leopoldo_Corkery",
        "phone": "1-477-935-8478 x6430",
        "website": "ola.org",
        "company": "Considine-Lockman",
        "department": "Engineering",
        "status": "Inactive",
        "role": "Backend Developer",
        "join_date": "2021-10-12",
        "location": "Berlin",
        "avatar": "M"
    },
    {
        "id": 7,
        "name": "Kurtis Weissnat",
        "email": "Telly.Hoeger@billy.biz",
        "username": "Elwyn.Skiles",
        "phone": "210.067.6132",
        "website": "elvis.io",
        "company": "Johns Group",
        "department": "Sales",
        "status": "On Leave",
        "role": "Sales Executive",
        "join_date": "2021-11-18",
        "location": "Dubai",
        "avatar": "K"
    },
    {
        "id": 8,
        "name": "Nicholas Runolfsdottir V",
        "email": "Sherwood@rosamond.me",
        "username": "Maxime_Nienow",
        "phone": "586.493.6943 x140",
        "website": "jacynthe.com",
        "company": "Abernathy Group",
        "department": "Finance",
        "status": "Active",
        "role": "Financial Analyst",
        "join_date": "2021-12-03",
        "location": "Singapore",
        "avatar": "N"
    },
    {
        "id": 9,
        "name": "Glenna Reichert",
        "email": "Chaim_McDermott@dana.io",
        "username": "Delphine",
        "phone": "(775)976-6794 x41206",
        "website": "conrad.com",
        "company": "Yost and Sons",
        "department": "Marketing",
        "status": "Remote",
        "role": "SEO Specialist",
        "join_date": "2022-01-15",
        "location": "Amsterdam",
        "avatar": "G"
    },
    {
        "id": 10,
        "name": "Clementina DuBuque",
        "email": "Rey.Padberg@karina.biz",
        "username": "Moriah.Stanton",
        "phone": "024-648-3804",
        "website": "ambrose.net",
        "company": "Hoeger LLC",
        "department": "IT",
        "status": "Active",
        "role": "Frontend Developer",
        "join_date": "2022-02-28",
        "location": "Paris",
        "avatar": "C"
    }
]

# Gets employees data.
def get_employees() -> List[Dict]:
    """Get all employees"""
    return mock_employees

# Gets employee by id data.
def get_employee_by_id(employee_id: int) -> Optional[Dict]:
    """Get employee by ID"""
    for employee in mock_employees:
        if employee["id"] == employee_id:
            return employee
    return None

# Creates employee data.
def add_employee(employee_data: Dict) -> Dict:
    """Add new employee"""
    new_id = max([emp["id"] for emp in mock_employees]) + 1
    new_employee = {
        "id": new_id,
        **employee_data,
        "avatar": employee_data["name"][0]
    }
    mock_employees.append(new_employee)
    return new_employee

# Updates employee data.
def update_employee(employee_id: int, update_data: Dict) -> Optional[Dict]:
    """Update employee"""
    for idx, employee in enumerate(mock_employees):
        if employee["id"] == employee_id:
            mock_employees[idx].update(update_data)
            return mock_employees[idx]
    return None

# Deletes employee data.
def delete_employee(employee_id: int) -> bool:
    """Delete employee"""
    for idx, employee in enumerate(mock_employees):
        if employee["id"] == employee_id:
            mock_employees.pop(idx)
            return True
    return False