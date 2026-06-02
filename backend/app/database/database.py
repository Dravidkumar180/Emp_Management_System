from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database file path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_FILE = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'employees.db'))
DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Required for SQLite
)

# Create session local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()