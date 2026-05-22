from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import employee_routes

# Create FastAPI app
app = FastAPI(
    title="Employee Management System API",
    description="Backend API for Employee Management System",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175", "http://127.0.0.1:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(employee_routes.router, prefix="/api/v1", tags=["Employees"])

@app.get("/")
async def root():
    return {
        "message": "Employee Management System API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "backend-api"
    }