import requests
import json

# Test the API
base_url = "http://127.0.0.1:8000"

def test_api():
    print("Testing Employee Management System API...")
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
    
    # Test get all employees
    try:
        response = requests.get(f"{base_url}/api/v1/employees")
        print(f"✅ GET /employees: {response.status_code}")
        print(f"   Total employees: {len(response.json())}")
    except Exception as e:
        print(f"❌ GET /employees failed: {e}")
    
    # Test get employee by ID
    try:
        response = requests.get(f"{base_url}/api/v1/employees/1")
        print(f"✅ GET /employees/1: {response.status_code}")
        data = response.json()
        print(f"   Employee: {data.get('name')} - {data.get('email')}")
    except Exception as e:
        print(f"❌ GET /employees/1 failed: {e}")

if __name__ == "__main__":
    test_api()