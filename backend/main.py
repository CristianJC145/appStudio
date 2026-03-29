"""
Meditation Audio Studio — FastAPI Backend
App principal: monta los routers de cada módulo.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import guiones
from routers import auth
try:
    from routers.guiones import PYDUB_AVAILABLE
except ImportError:
    PYDUB_AVAILABLE = False

app = FastAPI(title="Meditation Audio Studio", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://app-studio-frontend.qil8rz.easypanel.host",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Módulos ───────────────────────────────────────────────────
app.include_router(guiones.router)
app.include_router(auth.router)

# ── Health global ─────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"ok": True, "pydub": PYDUB_AVAILABLE}
