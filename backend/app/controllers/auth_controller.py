from fastapi import HTTPException
from app.services.auth_service import AuthService

class AuthController:
    @staticmethod
    def register(user_data: dict):
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
    def login(login_data: dict):
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