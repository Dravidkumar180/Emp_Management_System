"""Backend configuration helpers."""
class DatabaseConfig:
    """Database configuration settings"""
    
    # For future database integration
    DATABASE_URL = "sqlite:///./employees.db"  # Will be used later
    DATABASE_NAME = "employee_db"
    
    @classmethod
    # Gets config data.
    def get_config(cls):
        """Returns config data."""
        return {
            "url": cls.DATABASE_URL,
            "name": cls.DATABASE_NAME
        }