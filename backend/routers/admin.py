"""
Admin Router — Module config + Active users tracking
Endpoints:
  GET  /api/admin/modules
  PATCH /api/admin/modules/{module_id}
  POST /api/admin/heartbeat
  GET  /api/admin/active-users/count
  GET  /api/admin/active-users/stream  (SSE)
"""
import asyncio
import time
from typing import Dict

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials

from routers.auth import get_current_user, require_admin, _get_conn, _decode_token, _get_user_by_id, DB_NAME
from jose import JWTError

router = APIRouter(prefix="/api/admin", tags=["admin"])

# In-memory heartbeat store: {user_id: last_seen_unix}
_active: Dict[int, float] = {}
ACTIVE_TTL = 90  # seconds — user considered active if pinged within this window


# ── DB setup ────────────────────────────────────────────────────────────
def _ensure_tables():
    try:
        conn = _get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS module_config (
                    module_id  VARCHAR(50) PRIMARY KEY,
                    enabled    TINYINT(1)  NOT NULL DEFAULT 1,
                    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
        conn.close()
    except Exception as e:
        print(f"[admin] DB init warning: {e}")


# ── Module management ────────────────────────────────────────────────────
@router.get("/modules")
def get_modules():
    """Returns {module_id: bool} for all stored states. Modules not in DB are enabled by default."""
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT module_id, enabled FROM module_config")
        rows = cur.fetchall()
    conn.close()
    return {r["module_id"]: bool(r["enabled"]) for r in rows}


@router.patch("/modules/{module_id}")
def toggle_module(module_id: str, body: dict, _admin=Depends(require_admin)):
    """Enable or disable a module. Admin only."""
    enabled = int(bool(body.get("enabled", True)))
    conn = _get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO module_config (module_id, enabled)
               VALUES (%s, %s)
               ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)""",
            (module_id, enabled),
        )
    conn.close()
    return {"ok": True, "module_id": module_id, "enabled": bool(enabled)}


# ── Active users ─────────────────────────────────────────────────────────
@router.post("/heartbeat")
def heartbeat(current_user=Depends(get_current_user)):
    """Frontend calls this every 30 s to mark the user as online."""
    _active[current_user["id"]] = time.time()
    return {"ok": True}


def _count_active() -> int:
    cutoff = time.time() - ACTIVE_TTL
    # Clean stale entries while counting
    stale = [uid for uid, ts in _active.items() if ts <= cutoff]
    for uid in stale:
        del _active[uid]
    return len(_active)


@router.get("/active-users/count")
def active_count(_admin=Depends(require_admin)):
    return {"count": _count_active()}


@router.get("/active-users/stream")
async def active_stream(token: str = Query(...)):
    """SSE — pushes updated count every 5 s. Token passed as query param (EventSource limitation)."""
    try:
        payload = _decode_token(token)
        user = _get_user_by_id(int(payload["sub"]))
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    except (JWTError, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")

    async def generate():
        while True:
            count = _count_active()
            yield f"data: {count}\n\n"
            await asyncio.sleep(5)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


_ensure_tables()
