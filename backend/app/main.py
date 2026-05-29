from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import employee_routes, auth_routes
from app.database.database import engine
from app.database.models import Base

app = FastAPI(title="Employee Management System API", version="2.0.0")

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")

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

@app.get("/")
async def root():
    return {"message": "API is running", "status": "active"}