from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import re
import time
from core.database import get_db
from core.security import verify_password, hash_password, create_token, get_current_user
from core.config import (
    REGISTER_TOKEN,
    MASTER_HANDLE,
    ALLOW_SELF_REGISTER,
    COOKIE_SECURE,
    COOKIE_SAMESITE,
    JWT_EXPIRE_MINUTES,
)
from core.validation import clean_text, reject_html
from models.user import User
from datetime import datetime, timezone
from core.logger import log_auth, log_new_user, log_alert, read_log

HANDLE_RE = re.compile(r'^[a-zA-Z0-9_]{2,50}$')

router = APIRouter(prefix="/api/auth", tags=["auth"])

_FAILED_LOGIN_WINDOW_SECONDS = 15 * 60
_FAILED_LOGIN_LOCK_SECONDS = 10 * 60
_FAILED_LOGIN_LIMIT = 5
_LOGIN_ATTEMPTS: dict[str, dict[str, float | int]] = {}

# ── Schemas ───────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    handle:   str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=8, max_length=128)

class TokenResponse(BaseModel):
    access_token: str | None = None
    token_type:   str = "bearer"
    user:         dict

class RegisterRequest(BaseModel):
    handle:       str = Field(min_length=2, max_length=50)
    password:     str = Field(min_length=8, max_length=128)
    access_token: str = Field(min_length=1, max_length=256)

# ── Helpers ───────────────────────────────────────────────────────

def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="dc_access_token",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=JWT_EXPIRE_MINUTES * 60,
        path="/",
    )

def _clear_auth_cookie(response: Response):
    response.delete_cookie(key="dc_access_token", path="/")

def _check_brute_force(ip: str):
    """Alert if 3+ failed logins from same IP in recent logs."""
    recent = read_log("auth.log", 200)
    fails  = [e for e in recent if not e.get("success") and e.get("ip") == ip]
    if len(fails) >= 3:
        log_alert("critical", "brute_force", f"3+ failed logins from {ip}")


def _login_throttle_key(ip: str, handle: str) -> str:
    return f"{ip}:{handle.lower()}"


def _purge_stale_attempts(now: float):
    stale_keys = [
        key for key, data in _LOGIN_ATTEMPTS.items()
        if now - float(data.get("last", 0)) > _FAILED_LOGIN_WINDOW_SECONDS
        and float(data.get("blocked_until", 0)) <= now
    ]
    for key in stale_keys:
        _LOGIN_ATTEMPTS.pop(key, None)


def _enforce_login_throttle(ip: str, handle: str):
    now = time.time()
    _purge_stale_attempts(now)
    key = _login_throttle_key(ip, handle)
    data = _LOGIN_ATTEMPTS.get(key)
    if not data:
        return
    blocked_until = float(data.get("blocked_until", 0))
    if blocked_until > now:
        retry_after = max(1, int(blocked_until - now))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Try again in {retry_after} seconds.",
        )


def _record_failed_login(ip: str, handle: str):
    now = time.time()
    key = _login_throttle_key(ip, handle)
    data = _LOGIN_ATTEMPTS.get(key, {"count": 0, "last": now, "blocked_until": 0})
    if now - float(data.get("last", 0)) > _FAILED_LOGIN_WINDOW_SECONDS:
        data = {"count": 0, "last": now, "blocked_until": 0}
    data["count"] = int(data.get("count", 0)) + 1
    data["last"] = now
    if int(data["count"]) >= _FAILED_LOGIN_LIMIT:
        data["blocked_until"] = now + _FAILED_LOGIN_LOCK_SECONDS
        log_alert("high", "login_throttle", f"Temporarily blocked login attempts for {handle} from {ip}")
    _LOGIN_ATTEMPTS[key] = data


def _clear_failed_login(ip: str, handle: str):
    _LOGIN_ATTEMPTS.pop(_login_throttle_key(ip, handle), None)

# ── Routes ────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(payload: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    if not ALLOW_SELF_REGISTER:
        raise HTTPException(status_code=403, detail="Self-registration is disabled.")
    handle       = reject_html(clean_text(payload.handle, field="Handle", max_len=50), field="Handle")
    password     = clean_text(payload.password, field="Password", max_len=128, strip=False)
    access_token = clean_text(payload.access_token, field="Access token", max_len=256, strip=False)

    if len(REGISTER_TOKEN) < 16:
        raise HTTPException(status_code=503, detail="Registration token is not configured securely.")
    if not REGISTER_TOKEN or access_token != REGISTER_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid access token.")
    if not HANDLE_RE.match(handle):
        raise HTTPException(status_code=400, detail="Handle must be 2–50 characters, letters/numbers/underscores only.")
    if handle == MASTER_HANDLE:
        raise HTTPException(status_code=400, detail="Handle not available.")
    if db.query(User).filter(User.handle == handle).first():
        raise HTTPException(status_code=409, detail="Handle already taken.")

    user = User(
        handle   = handle,
        password = hash_password(password),
        rank     = "DEADCAT",
        is_admin = False,
    )
    db.add(user); db.commit(); db.refresh(user)

    ip = request.client.host if request.client else "unknown"
    log_new_user(handle, ip)

    token = create_token({"sub": user.handle, "is_admin": False})
    _set_auth_cookie(response, token)
    return {"access_token": token, "token_type": "bearer", "user": user.to_dict()}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    handle   = clean_text(payload.handle, field="Handle", max_len=50)
    password = clean_text(payload.password, field="Password", max_len=128, strip=False)
    ip       = request.client.host if request.client else "unknown"
    _enforce_login_throttle(ip, handle)
    user     = db.query(User).filter(User.handle == handle).first()

    if not user or not verify_password(password, user.password):
        log_auth(handle, ip, False, "invalid credentials")
        _record_failed_login(ip, handle)
        _check_brute_force(ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid handle or password",
        )

    if not user.is_active:
        log_auth(handle, ip, False, "account disabled")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact admin.",
        )

    user.last_seen = datetime.now(timezone.utc)
    db.commit()

    log_auth(user.handle, ip, True)
    _clear_failed_login(ip, handle)

    token = create_token({"sub": user.handle, "is_admin": user.is_admin})
    _set_auth_cookie(response, token)

    return TokenResponse(access_token=token, user=user.to_dict())


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()


@router.post("/logout")
def logout(response: Response):
    _clear_auth_cookie(response)
    return {"message": "Logged out successfully"}
