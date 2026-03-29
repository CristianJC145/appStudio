"""
Meditation Audio Studio — FastAPI Backend
App principal: monta los routers de cada módulo.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import guiones
from routers import auth
from routers import admin
try:
    from routers.guiones import PYDUB_AVAILABLE
except ImportError:
    PYDUB_AVAILABLE = False

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://app-studio-frontend.qil8rz.easypanel.host",
]

app = FastAPI(title="Meditation Audio Studio", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
        headers=_cors_headers(request),
    )

# ── Módulos ──────────────────────────────────────────────────
app.include_router(guiones.router)
app.include_router(auth.router)
app.include_router(admin.router)

# ── Health global ────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"ok": True, "pydub": PYDUB_AVAILABLE}
