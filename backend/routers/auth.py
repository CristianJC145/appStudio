"""
Auth Router — JWT + MySQL
Endpoints: /api/auth/login, /api/auth/register, /api/auth/me
Roles: 'admin' | 'user'
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import pymysql
import pymysql.cursors

# ── Config ─────────────────────────────────────────────────────────────
SECRET_KEY         = os.getenv("JWT_SECRET", "studio_jwt_secret_change_in_production_2025")
ALGORITHM          = "HS256"
TOKEN_EXPIRE_HOURS = 24 * 7   # 7 days

DB_HOST = os.getenv("DB_HOST", "app-studio_db")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "studio_db")

ROLES = {"admin", "user"}

# ── Core helpers ────────────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer  = HTTPBearer(auto_error=False)
router  = APIRouter(prefix="/api/auth", tags=["auth"])


def _get_conn():
    return pymysql.connect(
        host=DB_HOST, port=DB_PORT,
        user=DB_USER, password=DB_PASS,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        charset="utf8mb4",
        autocommit=True,
    )


def _ensure_tables():
    try:
        conn = _get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id         INT AUTO_INCREMENT PRIMARY KEY,
                    username   VARCHAR(80)  NOT NULL UNIQUE,
                    email      VARCHAR(180) NOT NULL UNIQUE,
                    password   VARCHAR(255) NOT NULL,
                    role       ENUM('admin','user') NOT NULL DEFAULT 'user',
                    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
                    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            # Migration: add role column if table already existed without it
            cur.execute("""
                SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
            """, (DB_NAME,))
            if cur.fetchone()["cnt"] == 0:
                cur.execute("""
                    ALTER TABLE users
                    ADD COLUMN role ENUM('admin','user') NOT NULL DEFAULT 'user'
                    AFTER password;
                """)
        conn.close()
    except Exception as e:
        print(f"[auth] DB init warning: {e}")


def _hash(pw: str) -> str:
    return pwd_ctx.hash(pw)

def _verify(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def _create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def _decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def _safe_user(row: dict) -> dict:
    """Return only public fields from a DB row."""
    return {
        "id":         row["id"],
        "username":   row["username"],
        "email":      row["email"],
        "role":       row["role"],
        "is_active":  row["is_active"],
        "created_at": str(row["created_at"]),
    }


# ── Schemas ────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── DB helpers ─────────────────────────────────────────────────────────
def _get_user_by_username(username: str) -> Optional[dict]:
    try:
        conn = _get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE username = %s LIMIT 1", (username,))
            row = cur.fetchone()
        conn.close()
        return row
    except Exception:
        return None

def _get_user_by_id(user_id: int) -> Optional[dict]:
    try:
        conn = _get_conn()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, email, role, is_active, created_at FROM users WHERE id = %s LIMIT 1",
                (user_id,)
            )
            row = cur.fetchone()
        conn.close()
        return row
    except Exception:
        return None

def _create_user(username: str, email: str, password: str, role: str = "user") -> dict:
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO users (username, email, password, role) VALUES (%s, %s, %s, %s)",
            (username.strip(), email.strip().lower(), _hash(password), role)
        )
        new_id = cur.lastrowid
    conn.close()
    return _get_user_by_id(new_id)


# ── Auth dependencies ───────────────────────────────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = _decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = _get_user_by_id(int(user_id))
        if not user or not user.get("is_active"):
            raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency that blocks non-admin users."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    return current_user


# ── Routes ─────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = _get_user_by_username(body.username.strip())
    if not user or not _verify(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")
    token = _create_token({"sub": str(user["id"])})
    return {"access_token": token, "token_type": "bearer", "user": _safe_user(user)}


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest):
    if len(body.username.strip()) < 3:
        raise HTTPException(status_code=422, detail="El nombre de usuario debe tener al menos 3 caracteres")
    if len(body.password) < 6:
        raise HTTPException(status_code=422, detail="La contraseña debe tener al menos 6 caracteres")
    if _get_user_by_username(body.username.strip()):
        raise HTTPException(status_code=409, detail="El nombre de usuario ya está en uso")
    try:
        user = _create_user(body.username, body.email, body.password, role="user")
        print(f"usuario", user)
    except Exception as e:
        if "email" in str(e):
            raise HTTPException(status_code=409, detail="El correo ya está registrado")
        raise HTTPException(status_code=500, detail="Error al crear usuario")
    token = _create_token({"sub": str(user["id"])})
    return {"access_token": token, "token_type": "bearer", "user": _safe_user(user)}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return _safe_user(current_user)


@router.post("/logout")
def logout():
    return {"ok": True}


# ── Admin: gestión de usuarios ──────────────────────────────────────────
@router.get("/users")
def list_users(admin: dict = Depends(require_admin)):
    """Lista todos los usuarios. Solo accesible por admins."""
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, username, email, role, is_active, created_at FROM users ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
    conn.close()
    return [_safe_user(r) for r in rows]


@router.patch("/users/{user_id}/role")
def change_role(user_id: int, body: dict, admin: dict = Depends(require_admin)):
    """Cambia el rol de un usuario. Solo admins."""
    new_role = body.get("role", "")
    if new_role not in ROLES:
        raise HTTPException(status_code=422, detail=f"Rol inválido. Valores: {ROLES}")
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute("UPDATE users SET role = %s WHERE id = %s", (new_role, user_id))
        if cur.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
    conn.close()
    return {"ok": True, "user_id": user_id, "role": new_role}


@router.patch("/users/{user_id}/active")
def toggle_active(user_id: int, body: dict, admin: dict = Depends(require_admin)):
    """Activa o desactiva un usuario. Solo admins."""
    is_active = int(bool(body.get("is_active", True)))
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute("UPDATE users SET is_active = %s WHERE id = %s", (is_active, user_id))
        if cur.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
    conn.close()
    return {"ok": True, "user_id": user_id, "is_active": bool(is_active)}


# Ensure DB tables on import
_ensure_tables()
