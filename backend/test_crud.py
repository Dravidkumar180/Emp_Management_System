import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_crud_operations():
    print("=" * 60)
    print("TESTING CRUD OPERATIONS")
    print("=" * 60)
    
    # 1. GET all employees
    print("\n1. GET all employees:")
    response = requests.get(f"{BASE_URL}/employees")
    print(f"   Status: {response.status_code}")
    print(f"   Count: {len(response.json())}")
    
    # 2. CREATE new employee
    print("\n2. CREATE new employee:")
    new_employee = {
        "name": "Test User",
        "email": "test@example.com",
        "role": "Software Engineer",
        "department": "Engineering",
        "status": "Active",
        "phone": "+1 555 123 4567",
        "location": "New York"
    }
    response = requests.post(f"{BASE_URL}/employees", json=new_employee)
    print(f"   Status: {response.status_code}")
    if response.status_code == 201:
        created = response.json()
        print(f"   Created: ID={created.get('id')}, Name={created.get('name')}")
        new_id = created.get('id')
    
    # 3. GET employee by ID
    if new_id:
        print(f"\n3. GET employee with ID {new_id}:")
        response = requests.get(f"{BASE_URL}/employees/{new_id}")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            emp = response.json()
            print(f"   Name: {emp.get('name')}, Email: {emp.get('email')}")
    
    # 4. UPDATE employee
    if new_id:
        print(f"\n4. UPDATE employee with ID {new_id}:")
        update_data = {
            "name": "Updated Test User",
            "status": "Remote"
        }
        response = requests.put(f"{BASE_URL}/employees/{new_id}", json=update_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            updated = response.json()
            print(f"   Updated Name: {updated.get('name')}, Status: {updated.get('status')}")
    
    # 5. DELETE employee
    if new_id:
        print(f"\n5. DELETE employee with ID {new_id}:")
        response = requests.delete(f"{BASE_URL}/employees/{new_id}")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   Deleted successfully!")
    
    # 6. Verify deletion
    if new_id:
        print(f"\n6. VERIFY deletion of ID {new_id}:")
        response = requests.get(f"{BASE_URL}/employees/{new_id}")
        print(f"   Status: {response.status_code} (should be 404)")
    
    print("\n" + "=" * 60)
    print("CRUD TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_crud_operations()