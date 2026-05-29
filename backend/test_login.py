import requests
import json

# Test login directly
url = "http://localhost:8000/api/v1/auth/login"
data = {
    "email": "dravid180@gmail.com",
    "password": "dravid@180"
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    print("\n✅ Login successful!")
    result = response.json()
    print(f"Token: {result['access_token'][:50]}...")
    print(f"User: {result['user']}")
else:
    print("\n❌ Login failed!")