import sqlite3
import os

# Check if database file exists
db_path = "employees.db"
if os.path.exists(db_path):
    print(f"✅ Database file found: {db_path}")
    print(f"📁 File size: {os.path.getsize(db_path)} bytes")
else:
    print(f"❌ Database file not found: {db_path}")

# Connect and query
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print(f"\n📊 Tables in database: {[t[0] for t in tables]}")

# Count employees
cursor.execute("SELECT COUNT(*) FROM employees;")
count = cursor.fetchone()[0]
print(f"\n👥 Total employees in database: {count}")

# Show first 5 employees
cursor.execute("SELECT id, name, email, department, status FROM employees LIMIT 5;")
employees = cursor.fetchall()
print("\n📋 First 5 employees:")
for emp in employees:
    print(f"   ID: {emp[0]}, Name: {emp[1]}, Dept: {emp[3]}, Status: {emp[4]}")

conn.close()