"""Starts the backend app and connects all routes."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import employee_routes, auth_routes , company_routes, audit_log_routes, user_invitation_routes, reactivation_request_routes, reinstatement_request_routes, holiday_routes
from app.routes.role_request_routes import router as role_request_routes
from app.database.database import engine, SessionLocal
from app.database.models import Base, Holiday
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate

app = FastAPI(title="Employee Management System API", version="2.0.0")

# Helps with ensure sqlite schema.
def ensure_sqlite_schema():
    """Runs ensure sqlite schema logic."""
    with engine.connect() as connection:
        user_columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(users)").fetchall()}
        if "deactivated_by_user_id" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN deactivated_by_user_id INTEGER")
        if "deactivated_by_name" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN deactivated_by_name VARCHAR(100)")
        if "deactivated_at" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN deactivated_at DATETIME")
        if "is_suspended" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT 0")
        if "suspension_reason" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN suspension_reason TEXT")
        if "suspended_by_user_id" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN suspended_by_user_id INTEGER")
        if "suspended_by_name" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN suspended_by_name VARCHAR(100)")
        if "suspended_at" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN suspended_at DATETIME")

        role_request_columns = {
            row[1] for row in connection.exec_driver_sql("PRAGMA table_info(role_change_requests)").fetchall()
        }
        if role_request_columns:
            if "user_id" not in role_request_columns:
                connection.exec_driver_sql("ALTER TABLE role_change_requests ADD COLUMN user_id INTEGER")
                connection.exec_driver_sql(
                    "UPDATE role_change_requests SET user_id = requester_id WHERE user_id IS NULL"
                )
            if "reason" not in role_request_columns:
                connection.exec_driver_sql("ALTER TABLE role_change_requests ADD COLUMN reason TEXT")
            if "reviewed_by" not in role_request_columns:
                connection.exec_driver_sql("ALTER TABLE role_change_requests ADD COLUMN reviewed_by INTEGER")
        connection.commit()

# Helps with seed default users.
def seed_default_users():
    """Runs seed default users logic."""
    db = SessionLocal()
    try:
        users = [
            {"name": "Dravid Kumar", "email": "dravid180@gmail.com", "password": "dravid@180", "role": "admin"},
            {"name": "Dravid Kumar", "email": "dravidkumar180@gmail.com", "password": "dravidkumar180", "role": "admin"},
            {"name": "Karthi", "email": "karthi180@gmail.com", "password": "karthi180", "role": "user"},
            {"name": "Suman", "email": "suman01@gmail.com", "password": "suman01", "role": "user"},
        ]

        for user_data in users:
            normalized_email = user_data["email"].strip().lower()
            existing = UserRepository.get_by_email(db, normalized_email)
            if existing:
                if existing.role != user_data["role"]:
                    existing.role = user_data["role"]
                    db.commit()
                    db.refresh(existing)
                    print(f"[*] Updated role for existing user: {normalized_email} -> {user_data['role']}")
                continue

            user_create = UserCreate(
                name=user_data["name"].strip(),
                email=normalized_email,
                password=user_data["password"],
                role=user_data["role"].strip().lower()
            )
            UserRepository.create(db, user_create)
            print(f"[+] Seeded user: {normalized_email} ({user_data['role']})")
    finally:
        db.close()

# Helps with seed default holidays.
def seed_default_holidays():
    """Seed 2026 company-scoped holidays used by the Holiday Calendar."""
    db = SessionLocal()
    try:
        public_holidays = [
            ("New Year's Day", "2026-01-01", "Public Holiday", "New year holiday."),
            ("Republic Day", "2026-01-26", "Public Holiday", "National holiday."),
            ("Holi", "2026-03-04", "Public Holiday", "Festival holiday."),
            ("Good Friday", "2026-04-03", "Public Holiday", "Good Friday observance."),
            ("Eid al-Fitr", "2026-03-20", "Public Holiday", "Festival holiday."),
            ("Independence Day", "2026-08-15", "Public Holiday", "National holiday."),
            ("Gandhi Jayanti", "2026-10-02", "Public Holiday", "National holiday."),
            ("Dussehra", "2026-10-20", "Public Holiday", "Festival holiday."),
            ("Diwali", "2026-11-08", "Public Holiday", "Festival holiday."),
            ("Christmas Day", "2026-12-25", "Public Holiday", "Christmas holiday."),
        ]

        monthly_company_holidays = [
            ("Company Planning Day", "2026-01-10"),
            ("Employee Wellness Day", "2026-02-10"),
            ("Innovation Day", "2026-03-10"),
            ("Company Foundation Day", "2026-04-10"),
            ("Learning Day", "2026-05-10"),
            ("Mid-Year Recharge Day", "2026-06-10"),
            ("Culture Day", "2026-07-10"),
            ("Team Retreat Day", "2026-08-10"),
            ("Service Excellence Day", "2026-09-10"),
            ("Product Day", "2026-10-10"),
            ("Gratitude Day", "2026-11-10"),
            ("Year-End Closure Day", "2026-12-10"),
        ]

        optional_by_company = {
            1: [
                ("Tamil New Year", "2026-04-14", "Optional Holiday", "Branch optional holiday for Company A."),
                ("Ayudha Puja", "2026-10-19", "Optional Holiday", "Branch optional holiday for Company A."),
            ],
            2: [
                ("Ugadi", "2026-03-19", "Optional Holiday", "Branch optional holiday for Company B."),
                ("Kannada Rajyotsava", "2026-11-01", "Optional Holiday", "Branch optional holiday for Company B."),
            ],
        }

        for company_id in [1, 2]:
            seed_items = [
                *public_holidays,
                *[
                    (name, date, "Company Holiday", "Monthly company holiday.")
                    for name, date in monthly_company_holidays
                ],
                *optional_by_company[company_id],
            ]

            for name, date, holiday_type, description in seed_items:
                exists = db.query(Holiday).filter(
                    Holiday.company_id == company_id,
                    Holiday.date == date,
                    Holiday.name == name,
                ).first()
                if exists:
                    continue
                db.add(Holiday(
                    company_id=company_id,
                    name=name,
                    date=date,
                    description=description,
                    holiday_type=holiday_type,
                    recurring=holiday_type in ["Public Holiday", "Optional Holiday"],
                    status="Active",
                ))
        db.commit()
    finally:
        db.close()

# Create tables on startup
@app.on_event("startup")
# Runs startup event.
async def startup_event():
    """Runs startup event logic."""
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_schema()
    print("[+] Database tables created")
    seed_default_users()
    seed_default_holidays()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(employee_routes.router, prefix="/api/v1", tags=["Employees"])
app.include_router(auth_routes.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(role_request_routes, prefix="/api/v1", tags=["Role Requests"])
app.include_router(company_routes.router, prefix="/api/v1", tags=["Companies"])
app.include_router(audit_log_routes.router, prefix="/api/v1", tags=["Audit Logs"])
app.include_router(user_invitation_routes.router, prefix="/api/v1", tags=["User Invitations"])
app.include_router(reactivation_request_routes.router, prefix="/api/v1", tags=["Reactivation Requests"])
app.include_router(reinstatement_request_routes.router, prefix="/api/v1", tags=["Reinstatement Requests"])
app.include_router(holiday_routes.router, prefix="/api/v1", tags=["Holidays"])

@app.get("/")
# Runs root.
async def root():
    """Runs root logic."""
    return {"message": "API is running", "status": "active"}