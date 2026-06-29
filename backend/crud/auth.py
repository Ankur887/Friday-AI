from database.db import SessionLocal
from database.models import User, EmailVerification, RefreshToken
from datetime import datetime, timedelta
from sqlalchemy import func
import uuid
import bcrypt
import random
import string


# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# ── Username helpers ──────────────────────────────────────────────────────────

def generate_base_username(first_name: str, last_name: str = "") -> str:
    base = first_name.lower().strip()
    if last_name and last_name.strip():
        base = f"{base}_{last_name.lower().strip()}"
    base = "".join(c for c in base if c.isalnum() or c == "_")
    return base


def get_available_username(first_name: str, last_name: str = "") -> str:
    db = SessionLocal()
    base = generate_base_username(first_name, last_name)
    username = base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base}_{counter}"
        counter += 1
    db.close()
    return username


def check_username_available(username: str) -> bool:
    db = SessionLocal()
    exists = db.query(User).filter(User.username == username).first()
    db.close()
    return exists is None


def check_email_available(email: str) -> bool:
    db = SessionLocal()
    exists = db.query(User).filter(
        func.lower(User.email) == email.lower()
    ).first()
    db.close()
    return exists is None


def get_user_by_identifier(identifier: str):
    db = SessionLocal()
    if "@" in identifier:
        user = db.query(User).filter(
            func.lower(User.email) == identifier.strip().lower()
        ).first()
    else:
        user = db.query(User).filter(
            func.lower(User.username) == identifier.strip().lower()
        ).first()
    db.close()
    return user


# ── OTP ───────────────────────────────────────────────────────────────────────

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def create_email_verification(user_id: str, otp_code: str) -> EmailVerification:
    """Create a signup/login verification OTP."""
    db = SessionLocal()
    # Invalidate old signup OTPs for this user only
    db.query(EmailVerification).filter(
        EmailVerification.user_id == user_id,
        EmailVerification.verified == False,
    ).delete()
    verification = EmailVerification(
        user_id    = user_id,
        otp_code   = otp_code,
        expires_at = datetime.utcnow() + timedelta(minutes=10),
        verified   = False,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)
    db.close()
    return verification


def verify_otp(user_id: str, otp_code: str) -> bool:
    """Verify signup / login 2FA OTP. Marks email as verified on success."""
    db = SessionLocal()
    verification = db.query(EmailVerification).filter(
        EmailVerification.user_id  == user_id,
        EmailVerification.otp_code == otp_code,
        EmailVerification.verified == False,
        EmailVerification.expires_at > datetime.utcnow(),
    ).first()
    if not verification:
        db.close()
        return False
    verification.verified = True
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.email_verified = True
    db.commit()
    db.close()
    return True


# ── Password Reset OTP ────────────────────────────────────────────────────────
# Uses a separate in-memory store keyed by (user_id, otp_code) so it never
# touches the email_verified flag and doesn't collide with signup OTPs.

_reset_otps: dict = {}   # { user_id: {"otp": str, "expires_at": datetime} }


def create_reset_otp(user_id: str, otp_code: str) -> None:
    """Store a password-reset OTP in memory for 10 minutes."""
    _reset_otps[user_id] = {
        "otp":        otp_code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
    }


def verify_reset_otp(user_id: str, otp_code: str) -> bool:
    """
    Return True if otp_code matches the stored reset OTP and is not expired.
    Consumes the OTP on success (one-time use).
    """
    entry = _reset_otps.get(user_id)
    if not entry:
        return False
    if entry["otp"] != otp_code:
        return False
    if datetime.utcnow() > entry["expires_at"]:
        _reset_otps.pop(user_id, None)
        return False
    # Consume it
    _reset_otps.pop(user_id, None)
    return True


def reset_user_password(user_id: str, new_password: str) -> bool:
    """Hash and persist the new password. Returns False if user not found."""
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        return False
    user.password_hash = hash_password(new_password)
    db.commit()
    db.close()
    return True


# ── User CRUD ─────────────────────────────────────────────────────────────────

def create_user(first_name: str, last_name: str, username: str,
                email: str, password: str) -> User:
    db = SessionLocal()
    user = User(
        first_name    = first_name,
        last_name     = last_name,
        username      = username,
        email         = email.lower(),
        password_hash = hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def get_user_by_email(email: str):
    db = SessionLocal()
    user = db.query(User).filter(
        func.lower(User.email) == email.lower()
    ).first()
    db.close()
    return user


def get_user_by_id(user_id: str):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    db.close()
    return user


def update_last_login(user_id: str):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.last_login = datetime.utcnow()
        db.commit()
    db.close()


# ── Refresh Tokens ────────────────────────────────────────────────────────────

def save_refresh_token(user_id: str, token: str):
    db = SessionLocal()
    rt = RefreshToken(
        user_id    = user_id,
        token      = token,
        expires_at = datetime.utcnow() + timedelta(days=7),
    )
    db.add(rt)
    db.commit()
    db.close()


def get_refresh_token(token: str):
    db = SessionLocal()
    rt = db.query(RefreshToken).filter(
        RefreshToken.token      == token,
        RefreshToken.expires_at > datetime.utcnow(),
    ).first()
    db.close()
    return rt


def delete_refresh_token(token: str):
    db = SessionLocal()
    db.query(RefreshToken).filter(RefreshToken.token == token).delete()
    db.commit()
    db.close()