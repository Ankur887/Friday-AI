from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

SECRET_KEY     = os.getenv("JWT_SECRET", "change_this_secret_in_production")
ALGORITHM      = "HS256"
ACCESS_EXPIRE  = 15          # minutes
REFRESH_EXPIRE = 7 * 24 * 60 # minutes (7 days)


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        SECRET_KEY, algorithm=ALGORITHM
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=REFRESH_EXPIRE)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        SECRET_KEY, algorithm=ALGORITHM
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None