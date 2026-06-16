from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate
from app.utils.auth import verify_password, create_access_token
from app.database.database import SessionLocal
from app.services.user_invitation_service import UserInvitationService
from fastapi import HTTPException
import traceback

COMPANY_SLUG_TO_ID = {
    "company-a": 1,
    "company-b": 2,
}

def normalize_company_id(company_id):
    if company_id is None or company_id == "":
        return None
    if isinstance(company_id, int):
        return company_id

    normalized = str(company_id).strip().lower()
    if normalized in COMPANY_SLUG_TO_ID:
        return COMPANY_SLUG_TO_ID[normalized]

    try:
        return int(normalized)
    except ValueError:
        return None

class AuthService:
    @staticmethod
    def register(user_data: dict):
        db = SessionLocal()
        try:
            print(f"[*] Registering user: {user_data.get('email')}")
            
# Normalize email and name for lookup and create
            user_data['email'] = user_data['email'].strip().lower()
            user_data['name'] = user_data['name'].strip()
            user_data['role'] = user_data.get('role', 'user').strip().lower()
            invite_token = user_data.pop('invite_token', None)
            invitation = None
            if invite_token:
                invitation = UserInvitationService.validate_invitation_for_registration(
                    db, invite_token, user_data['email']
                )
                user_data['role'] = invitation.role
                user_data['company_id'] = invitation.company_id
            else:
                user_data['company_id'] = normalize_company_id(user_data.get('company_id')) or 1

            # Check if user exists
            existing = UserRepository.get_by_email(db, user_data['email'])
            if existing:
                print(f"[-] User already exists: {user_data['email']}")
                return None
            
            # Create user
            user_create = UserCreate(**user_data)
            new_user = UserRepository.create(db, user_create)
            if invitation:
                UserInvitationService.mark_accepted(db, invitation, new_user.id)
            
            print(f"[+] User created: {new_user.email}")
            return {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role,
                "company_id": new_user.company_id
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"[-] Registration error: {e}")
            print(traceback.format_exc())
            return None
        finally:
            db.close()
    
    @staticmethod
    def login(login_data: dict):
        db = SessionLocal()
        try:
            print(f"[*] Login attempt: {login_data.get('email')}")
            
            user = UserRepository.get_by_email_or_name(db, login_data["email"])
            if not user:
                print(f"[-] User not found: {login_data['email']}")
                return None

            if not verify_password(login_data["password"], user.password):
                print(f"[-] Invalid password for: {login_data['email']}")
                return None

            requested_company_id = normalize_company_id(login_data.get("company_id"))
            if requested_company_id and user.company_id != requested_company_id:
                raise HTTPException(status_code=403, detail="User does not belong to the requested company")

            final_company_id = user.company_id or 1
            if user.company_id != final_company_id:
                user = UserRepository.update_company(db, user.id, final_company_id) or user
            
            access_token = create_access_token(
                data={"sub": user.email, "role": user.role, "company_id": final_company_id}
            )
            
            print(f"[+] Login successful: {user.email}")
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                    "company_id": final_company_id,
                    "is_active": user.is_active,
                    "deactivated_by_user_id": user.deactivated_by_user_id,
                    "deactivated_by_name": user.deactivated_by_name,
                    "deactivated_at": user.deactivated_at.isoformat() if user.deactivated_at else None
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"[-] Login error: {e}")
            print(traceback.format_exc())
            return None
        finally:
            db.close()

    @staticmethod
    def reset_password(reset_data: dict):
        db = SessionLocal()
        try:
            print(f"[*] Password reset attempt: {reset_data.get('email')}")
            user = UserRepository.get_by_email_or_name(db, reset_data["email"])
            if not user:
                print(f"[-] User not found: {reset_data['email']}")
                return None
            updated_user = UserRepository.update_password(db, reset_data["email"], reset_data["password"])
            if not updated_user:
                return None
            print(f"[+] Password updated for: {updated_user.email}")
            return {
                "email": updated_user.email,
                "name": updated_user.name,
                "role": updated_user.role
            }
        except Exception as e:
            print(f"[-] Password reset error: {e}")
            print(traceback.format_exc())
            return None
        finally:
            db.close()

    @staticmethod
    def list_admin_reviewers(company_id=None):
        db = SessionLocal()
        try:
            normalized_company_id = normalize_company_id(company_id)
            admins = UserRepository.get_admins(db, normalized_company_id)
            return [admin.email for admin in admins]
        finally:
            db.close()
