from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import employee_routes, auth_routes
from app.routes.role_request_routes import router as role_request_routes
from app.database.database import engine, SessionLocal
from app.database.models import Base
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate

app = FastAPI(title="Employee Management System API", version="2.0.0")

def seed_default_users():
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
                    print(f"🔧 Updated role for existing user: {normalized_email} -> {user_data['role']}")
                continue

            user_create = UserCreate(
                name=user_data["name"].strip(),
                email=normalized_email,
                password=user_data["password"],
                role=user_data["role"].strip().lower()
            )
            UserRepository.create(db, user_create)
            print(f"✅ Seeded user: {normalized_email} ({user_data['role']})")
    finally:
        db.close()

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    seed_default_users()

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

@app.get("/")
async def root():
    return {"message": "API is running", "status": "active"}