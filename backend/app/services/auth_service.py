import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from app.database import get_db

ROLE_PERMISSIONS = {
    "admin": [
        "suspected_incidents:read", "suspected_incidents:review", "suspected_incidents:assign", "suspected_incidents:delete",
        "tasks:read", "tasks:accept", "tasks:complete",
        "devices:read", "settings:read", "settings:write", "stats:read",
    ],
    "reviewer": ["suspected_incidents:read", "suspected_incidents:review", "tasks:read", "devices:read", "stats:read"],
    "dispatcher": ["suspected_incidents:read", "suspected_incidents:assign", "tasks:read", "devices:read", "stats:read"],
    "patrol": ["suspected_incidents:read", "tasks:read", "tasks:accept", "tasks:complete", "devices:read"],
}

SESSION_DAYS = 7
PASSWORD_ALGORITHM = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 260_000


def now_iso() -> str:
    return datetime.now(timezone(timedelta(hours=8))).isoformat()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    ).hex()
    return f"{PASSWORD_ALGORITHM}${PASSWORD_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected_digest = stored_hash.split("$", 3)
        if algorithm != PASSWORD_ALGORITHM:
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations),
        ).hex()
        return hmac.compare_digest(digest, expected_digest)
    except (ValueError, TypeError):
        return False


def serialize_user(row):
    if not row:
        return None
    role = row["role"]
    return {
        "id": row["id"],
        "username": row["username"],
        "display_name": row["display_name"],
        "role": role,
        "permissions": ROLE_PERMISSIONS.get(role, []),
    }


def login(username: str, password: str):
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE username=?",
            ((username or "").strip(),),
        ).fetchone()
        if not row or not verify_password(password or "", row["password_hash"]):
            return None

        token = secrets.token_urlsafe(32)
        created_at = now_iso()
        expires_at = (datetime.now(timezone(timedelta(hours=8))) + timedelta(days=SESSION_DAYS)).isoformat()
        conn.execute(
            "INSERT INTO auth_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, row["id"], created_at, expires_at),
        )
        conn.commit()
        return {"token": token, "user": serialize_user(row)}
    finally:
        conn.close()


def get_user_by_token(token: str | None):
    if not token:
        return None
    conn = get_db()
    try:
        row = conn.execute(
            """SELECT u.* FROM auth_sessions s
               JOIN users u ON u.id = s.user_id
               WHERE s.token=? AND s.expires_at >= ?""",
            (token, now_iso()),
        ).fetchone()
        return serialize_user(row)
    finally:
        conn.close()


def logout(token: str | None):
    if not token:
        return {"logged_out": True}
    conn = get_db()
    try:
        conn.execute("DELETE FROM auth_sessions WHERE token=?", (token,))
        conn.commit()
        return {"logged_out": True}
    finally:
        conn.close()


def has_permission(user: dict, permission: str) -> bool:
    return permission in user.get("permissions", [])


def list_assignable_users():
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM users WHERE role = 'patrol' ORDER BY display_name"
        ).fetchall()
        return [serialize_user(row) for row in rows]
    finally:
        conn.close()
