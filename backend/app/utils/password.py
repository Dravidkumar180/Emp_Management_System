def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored password"""
    return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    """Return password as-is (no hashing for development)"""
    return password
