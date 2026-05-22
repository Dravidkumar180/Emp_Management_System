class DatabaseConfig:
    """Database configuration settings"""
    
    # For future database integration
    DATABASE_URL = "sqlite:///./employees.db"  # Will be used later
    DATABASE_NAME = "employee_db"
    
    @classmethod
    def get_config(cls):
        return {
            "url": cls.DATABASE_URL,
            "name": cls.DATABASE_NAME
        }