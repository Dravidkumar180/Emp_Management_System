"""Handles auth requests."""
from fastapi import HTTPException
from app.services.auth_service import AuthService

# Defines the auth controller class.
class AuthController:
    """Groups auth controller helper functions."""
    @staticmethod
    # Runs register.
    def register(user_data: dict):
        """Runs register logic."""
        try:
            result = AuthService.register(user_data)
            if not result:
                raise HTTPException(status_code=400, detail="User already exists")
            return {"message": "User registered successfully", "user": result}
        except HTTPException:
            raise
        except Exception as e:
            print(f"Controller register error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @staticmethod
    # Helps with login.
    def login(login_data: dict):
        """Runs login logic."""
        try:
            result = AuthService.login(login_data)
            if not result:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            return result
        except HTTPException:
            raise
        except Exception as e:
            print(f"Controller login error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    # Runs reset password.
    def reset_password(reset_data: dict):
        """Runs reset password logic."""
        try:
            result = AuthService.reset_password(reset_data)
            if not result:
                raise HTTPException(status_code=404, detail="User not found")
            return {"message": "Password has been reset successfully"}
        except HTTPException:
            raise
        except Exception as e:
            print(f"Controller reset password error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    # Gets admin reviewers data.
    def get_admin_reviewers(company_id=None):
        """Returns admin reviewers data."""
        try:
            emails = AuthService.list_admin_reviewers(company_id)
            return {"admins": emails}
        except Exception as e:
            print(f"Controller get_admin_reviewers error: {e}")
            raise HTTPException(status_code=500, detail=str(e))