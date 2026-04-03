"""
Generador de Guiones IA — Router FastAPI
Rutas: /api/generador/*
Todas requieren autenticación JWT.
"""
import os
import re
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from routers.auth import get_current_user
from services import dna_processor, youtube_service, transcript_service, script_generator, telegram_service, docx_generator

router = APIRouter(prefix="/api/generador", tags=["generador"])

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MAX_FILE_SIZE     = 10 * 1024 * 1024   # 10 MB por archivo
MAX_TOTAL_SIZE    = 50 * 1024 * 1024   # 50 MB total
ALLOWED_EXT       = {".pdf", ".txt", ".docx", ".doc", ".xlsx", ".xls", ".csv"}


# ── Schemas ─────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    nicho:     str
    region:    str
    duracion:  str
    instruccion: Optional[str] = ""
    video_info: dict           # {id, titulo, canal, vistas, duracion_minutos, url, ...}


class TelegramConfigRequest(BaseModel):
    bot_token: str
    chat_id:   str


class SendTelegramRequest(BaseModel):
    script:    str
    titulo:    str = "Guión"
    video_url: str = ""


# ── Helpers ──────────────────────────────────────────────────────────────────

def _require_api_key() -> str:
    key = ANTHROPIC_API_KEY
    if not key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada en el servidor")
    return key


def _validate_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Archivo sin nombre")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido: {ext}. Permitidos: {', '.join(ALLOWED_EXT)}")


# ── DNA endpoints ────────────────────────────────────────────────────────────

@router.get("/dna")
def get_dna(user: dict = Depends(get_current_user)):
    """Retorna el DNA guardado del usuario, o null si no existe."""
    dna = dna_processor.load_dna(user["id"])
    return {"dna": dna}


@router.post("/dna/process")
async def process_dna(
    exitosos:          list[UploadFile] = File(default=[]),
    titulos:           list[UploadFile] = File(default=[]),
    analisis:          list[UploadFile] = File(default=[]),
    bajo_rendimiento:  list[UploadFile] = File(default=[]),
    user: dict = Depends(get_current_user),
):
    """
    Recibe archivos en 4 zonas, extrae texto, llama a Claude y guarda el DNA.
    """
    api_key = _require_api_key()

    # Agrupar archivos por zona
    zones = {
        "exitosos":          exitosos,
        "titulos":           titulos,
        "analisis":          analisis,
        "bajo_rendimiento":  bajo_rendimiento,
    }

    extracted = []
    total_size = 0

    for zone_name, files in zones.items():
        for file in files:
            if not file or not file.filename:
                continue
            _validate_file(file)
            data = await file.read()

            if len(data) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"Archivo '{file.filename}' supera 10 MB")
            total_size += len(data)
            if total_size > MAX_TOTAL_SIZE:
                raise HTTPException(status_code=400, detail="El total de archivos supera 50 MB")

            text = dna_processor.extract_text_from_file(file.filename, data)
            if text.strip():
                extracted.append({"zone": zone_name, "filename": file.filename, "text": text})

    if not extracted:
        raise HTTPException(status_code=400, detail="No se pudo extraer texto de los archivos. Verifica que no estén vacíos o protegidos.")

    try:
        dna = dna_processor.process_dna_with_claude(extracted, api_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar con IA: {str(e)}")

    dna_processor.save_dna(user["id"], dna)
    return {"ok": True, "dna": dna}


@router.delete("/dna")
def delete_dna(user: dict = Depends(get_current_user)):
    """Elimina el DNA del usuario."""
    deleted = dna_processor.delete_dna(user["id"])
    return {"ok": deleted}


# ── Trending endpoint ────────────────────────────────────────────────────────

@router.get("/trending")
def get_trending(
    nicho:  str,
    region: str,
    hours:  int = 72,
    user: dict = Depends(get_current_user),
):
    """Busca videos trending del nicho en la región dada."""
    try:
        videos = youtube_service.search_trending_videos(nicho, region, hours=hours)
        return {"videos": videos}
    except ValueError as e:
        # API key no configurada — retornar lista vacía con flag
        return {"videos": [], "api_missing": True, "detail": str(e)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error buscando tendencias: {str(e)}")


# ── Transcript endpoint ───────────────────────────────────────────────────────

class TranscriptRequest(BaseModel):
    video_id:         str
    duration_minutes: int = 10
    video_info:       Optional[dict] = None


@router.post("/transcript")
def get_transcript(body: TranscriptRequest, user: dict = Depends(get_current_user)):
    """Extrae y analiza el contenido del video. Usa caché 24h."""
    api_key = _require_api_key()
    try:
        result = transcript_service.get_video_content(
            video_id=body.video_id,
            duration_minutes=body.duration_minutes,
            api_key=api_key,
            video_info=body.video_info,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al extraer contenido del video: {str(e)}")


# ── Generate script endpoint ──────────────────────────────────────────────────

@router.post("/generate")
def generate(body: GenerateRequest, user: dict = Depends(get_current_user)):
    """Genera el guión usando DNA + análisis del video."""
    api_key = _require_api_key()

    dna = dna_processor.load_dna(user["id"])
    if not dna:
        raise HTTPException(status_code=400, detail="No hay DNA configurado. Sube los archivos del canal primero.")

    video_id = body.video_info.get("id", "")
    duration_minutes = body.video_info.get("duracion_minutos", 10)

    # Obtener contenido del video (usa caché si existe)
    try:
        video_content = transcript_service.get_video_content(
            video_id=video_id,
            duration_minutes=duration_minutes,
            api_key=api_key,
            video_info=body.video_info,
        )
    except Exception as e:
        # No bloquear la generación si falla la transcripción
        video_content = {"transcript": "", "analysis": {}, "method": "none"}

    try:
        script_text = script_generator.generate_script(
            dna=dna,
            video_info=body.video_info,
            video_content=video_content,
            duracion=body.duracion,
            instruccion=body.instruccion or "",
            api_key=api_key,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar guión: {str(e)}")

    return {
        "script":         script_text,
        "video_method":   video_content.get("method", "none"),
        "video_analysis": video_content.get("analysis", {}),
    }


# ── Telegram endpoints ────────────────────────────────────────────────────────

@router.get("/telegram-config")
def get_telegram_config(user: dict = Depends(get_current_user)):
    config = telegram_service.load_telegram_config(user["id"])
    if config:
        # Ocultar parte del token por seguridad
        token = config.get("bot_token", "")
        masked = token[:10] + "***" + token[-5:] if len(token) > 15 else "***"
        return {"configured": True, "chat_id": config.get("chat_id", ""), "token_preview": masked}
    return {"configured": False}


@router.post("/telegram-config")
def save_telegram_config(body: TelegramConfigRequest, user: dict = Depends(get_current_user)):
    if not body.bot_token.strip() or not body.chat_id.strip():
        raise HTTPException(status_code=400, detail="Token y Chat ID son requeridos")
    telegram_service.save_telegram_config(user["id"], body.bot_token.strip(), body.chat_id.strip())
    return {"ok": True}


@router.post("/telegram-config/test")
def test_telegram(user: dict = Depends(get_current_user)):
    config = telegram_service.load_telegram_config(user["id"])
    if not config:
        raise HTTPException(status_code=400, detail="No hay configuración de Telegram guardada")
    result = telegram_service.send_test_message(config["bot_token"], config["chat_id"])
    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Error de conexión"))
    return {"ok": True}


@router.post("/send-telegram")
def send_to_telegram(body: SendTelegramRequest, user: dict = Depends(get_current_user)):
    config = telegram_service.load_telegram_config(user["id"])
    if not config:
        raise HTTPException(status_code=400, detail="Configura el bot de Telegram primero")

    # Generar nombre de archivo limpio
    safe_title = re.sub(r"[^\w\s-]", "", body.titulo)[:60].strip().replace(" ", "_")
    filename = f"guion_{safe_title}.docx"

    try:
        docx_bytes = docx_generator.generate_docx(body.script, body.titulo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando documento: {str(e)}")

    caption = f"📝 {body.titulo}"
    if body.video_url:
        caption += f"\n🔗 Basado en: {body.video_url}"

    result = telegram_service.send_document(
        config["bot_token"], config["chat_id"],
        docx_bytes, filename, caption,
    )
    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Error enviando a Telegram"))

    return {"ok": True}
