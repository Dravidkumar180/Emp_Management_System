"""Shared backend helper functions."""
from typing import Dict, Any

# Helps with format response.
def format_response(success: bool, message: str, data: Any = None) -> Dict:
    """Format API response"""
    response = {
        "success": success,
        "message": message
    }
    if data is not None:
        response["data"] = data
    return response

# Helps with validate email.
def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None