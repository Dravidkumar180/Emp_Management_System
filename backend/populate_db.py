"""Populate the local employees table with sample records from JSONPlaceholder."""
import sqlite3
import requests

# Connect to the SQLite database used by the backend.
print("Connecting to database...")
conn = sqlite3.connect('employees.db')
cursor = conn.cursor()

# Fetch sample user records that will be transformed into employee rows.
print("Fetching data from API...")
response = requests.get('https://jsonplaceholder.typicode.com/users')
users = response.json()

# Lookup lists provide repeatable employee attributes for the imported users.
departments = ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations', 'IT', 'Product']
statuses = ['Active', 'Active', 'Remote', 'On Leave', 'Active', 'Inactive', 'Active', 'Remote']
roles = ['Software Engineer', 'HR Manager', 'Marketing Lead', 'Sales Executive', 'Financial Analyst', 'Operations Manager', 'UI/UX Designer', 'Product Manager']
locations = ['New York', 'London', 'Tokyo', 'Sydney', 'Toronto', 'Berlin', 'Dubai', 'Singapore']

count = 0
for user in users:
    # Map each external user into the local employee schema.
    index = user['id'] % len(departments)
    username = user['name'].lower().replace(' ', '.')
    avatar = user['name'][0].upper()
    
    cursor.execute('''
        INSERT OR REPLACE INTO employees 
        (id, name, email, username, phone, website, company, department, status, role, location, join_date, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user['id'],
        user['name'],
        user['email'],
        username,
        user['phone'],
        user['website'],
        user['company']['name'],
        departments[index],
        statuses[index],
        roles[index],
        locations[index],
        f"202{user['id'] % 3}-0{(user['id'] % 9) + 1}-15",
        avatar
    ))
    count += 1

# Commit all inserted records and close the database connection.
conn.commit()
conn.close()
print(f' Successfully added {count} employees to database!')