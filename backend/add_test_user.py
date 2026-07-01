"""Seed a local development admin user into the SQLite database."""
import sqlite3

def add_test_user():
    """Create the users table if needed and insert the default admin account."""
    # Open the local SQLite database used by the development backend.
    conn = sqlite3.connect('employees.db')
    cursor = conn.cursor()
    
    # Create users table if not exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if user exists
    cursor.execute("SELECT * FROM users WHERE email = 'dravid180@gmail.com'")
    existing = cursor.fetchone()
    
    if existing:
        print("✅ User already exists!")
        # Report the existing account so the script is safe to rerun.
        cursor.execute("SELECT id, name, email, role FROM users WHERE email = 'dravid180@gmail.com'")
        user = cursor.fetchone()
        print(f"   ID: {user[0]}, Name: {user[1]}, Email: {user[2]}, Role: {user[3]}")
    else:
        # Add test user (plain password for development)
        cursor.execute('''
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        ''', ('Dravid Kumar', 'dravid180@gmail.com', 'dravid@180', 'admin'))
        conn.commit()
        print("✅ Test user added successfully!")
        print("   Email: dravid180@gmail.com")
        print("   Password: dravid@180")
        print("   Role: Admin")
    
    # Show all users
    print("\n📋 All users in database:")
    cursor.execute("SELECT id, name, email, role FROM users")
    users = cursor.fetchall()
    for user in users:
        print(f"   ID: {user[0]}, Name: {user[1]}, Email: {user[2]}, Role: {user[3]}")
    
    # Close the connection after all seed and reporting work is complete.
    conn.close()

if __name__ == "__main__":
    # Run the seed helper when this file is executed directly.
    add_test_user()
