"""
Meditation Audio Studio — FastAPI Backend v2
Añade revisión de segmentos de intro (igual que afirmaciones).
"""

import re
import os
import json
import time
import uuid
import hashlib
import tempfile
import subprocess
import threading
import requests
from pathlib import Path
from typing import Optional
from collections import defaultdict

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

try:
    from pydub import AudioSegment
    from pydub.silence import detect_silence
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

# =============================================================
#  APP
# =============================================================

app = FastAPI(title="Meditation Audio Studio", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CARPETA_TEMP   = Path("temp_chunks")
CARPETA_SALIDA = Path("salida")
CARPETA_TEMP.mkdir(exist_ok=True)
CARPETA_SALIDA.mkdir(exist_ok=True)

# Estado global de jobs en memoria
jobs: dict[str, dict] = {}
job_events: dict[str, list] = defaultdict(list)
job_locks: dict[str, threading.Event] = {}

# =============================================================
#  MODELOS PYDANTIC
# =============================================================

class VoiceSettings(BaseModel):
    stability: float = 0.45
    similarity_boost: float = 0.95
    style: float = 0.01
    use_speaker_boost: bool = True

class Config(BaseModel):
    api_key: str
    voice_id: str = "0ZflTCV1dnNGRdqxOiW6"
    model_id: str = "eleven_multilingual_v2"
    language_code: str = "es"
    voice_settings: VoiceSettings = VoiceSettings()
    # Intro
    intro_voice_speed: float = 1.0
    intro_tempo_factor: float = 0.98
    # Afirmaciones
    afirm_voice_speed: float = 0.94
    afirm_tempo_factor: float = 0.95
    # Meditación
    medit_voice_speed: float = 0.90
    medit_tempo_factor: float = 0.91
    # Silencios
    pausa_entre_oraciones: int = 400
    pausa_entre_afirmaciones: int = 10000
    pausa_intro_a_afirm: int = 2000
    pausa_afirm_a_medit: int = 3000
    pausa_entre_meditaciones: int = 5000
    # Extra
    extend_silence: bool = False
    factor_coma: float = 1.0
    factor_punto: float = 1.2
    factor_suspensivos: float = 1.5
    silence_thresh_db: int = -40
    silence_min_ms: int = 80
    max_chars_parrafo: int = 270

class GenerateRequest(BaseModel):
    guion: str
    config: Config
    nombre: str = "meditacion"

class ReviewDecision(BaseModel):
    job_id: str
    section: str    # "intro" | "afirm" | "medit"
    index: int
    decision: str   # "ok" | "regenerate" | "skip"
    new_text: Optional[str] = None  # Si se provee, reemplaza el texto antes de regenerar

# =============================================================
#  LÓGICA DE AUDIO
# =============================================================

def silencio(ms: int) -> "AudioSegment":
    return AudioSegment.silent(duration=ms)

def hash_texto(texto: str, voice_speed: float, settings: dict) -> str:
    contenido = json.dumps(
        {"texto": texto, "settings": settings, "speed": voice_speed},
        sort_keys=True
    )
    return hashlib.md5(contenido.encode()).hexdigest()[:10]

def ruta_cache(carpeta: Path, prefijo: str, indice: int, texto: str,
               voice_speed: float, settings: dict) -> Path:
    h = hash_texto(texto, voice_speed, settings)
    return carpeta / f"{prefijo}_{indice:05d}_{h}.wav"

def _atempo_chain(factor: float) -> str:
    filtros = []
    f = factor
    while f < 0.5:
        filtros.append("atempo=0.5")
        f /= 0.5
    while f > 2.0:
        filtros.append("atempo=2.0")
        f /= 2.0
    filtros.append(f"atempo={f:.6f}")
    return ",".join(filtros)

def aplicar_tempo(audio: "AudioSegment", factor: float) -> "AudioSegment":
    if factor == 1.0:
        return audio
    tmp_in  = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_out = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_in.close()
    tmp_out.close()
    try:
        audio.export(tmp_in.name, format="wav")
        subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in.name,
             "-filter:a", _atempo_chain(factor),
             "-ar", str(audio.frame_rate), tmp_out.name],
            check=True, capture_output=True
        )
        return AudioSegment.from_wav(tmp_out.name)
    finally:
        os.unlink(tmp_in.name)
        os.unlink(tmp_out.name)

def extender_silencios_internos(audio: "AudioSegment", cfg: Config) -> "AudioSegment":
    rangos = detect_silence(audio, min_silence_len=cfg.silence_min_ms,
                            silence_thresh=cfg.silence_thresh_db)
    if not rangos:
        return audio
    resultado = AudioSegment.empty()
    cursor = 0
    for inicio, fin in rangos:
        if inicio > cursor:
            resultado += audio[cursor:inicio]
        dur = fin - inicio
        factor = (cfg.factor_coma if dur < 400
                  else cfg.factor_punto if dur < 900
                  else cfg.factor_suspensivos)
        resultado += silencio(int(dur * factor))
        cursor = fin
    if cursor < len(audio):
        resultado += audio[cursor:]
    return resultado

def texto_a_audio_api(texto: str, ruta_salida: Path,
                      voice_speed: float, cfg: Config) -> bool:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{cfg.voice_id}"
    headers = {"xi-api-key": cfg.api_key, "Content-Type": "application/json"}
    payload = {
        "text": texto,
        "model_id": cfg.model_id,
        "language_code": cfg.language_code,
        "voice_settings": {**cfg.voice_settings.model_dump(), "speed": voice_speed},
    }
    for intento in range(1, 4):
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=60)
            if r.status_code == 200:
                ruta_salida.write_bytes(r.content)
                return True
        except Exception:
            pass
        time.sleep(2 ** intento)
    return False

def cargar_oracion(texto: str, carpeta: Path, prefijo: str, indice: int,
                   voice_speed: float, tempo_factor: float, cfg: Config,
                   force_regen: bool = False) -> Optional["AudioSegment"]:
    settings_dict = cfg.voice_settings.model_dump()
    ruta = ruta_cache(carpeta, prefijo, indice, texto, voice_speed, settings_dict)
    if force_regen and ruta.exists():
        ruta.unlink()
    if not ruta.exists():
        ok = texto_a_audio_api(texto, ruta, voice_speed, cfg)
        if not ok:
            return None
    audio = AudioSegment.from_file(ruta)
    if cfg.extend_silence:
        audio = extender_silencios_internos(audio, cfg)
    if tempo_factor != 1.0:
        audio = aplicar_tempo(audio, tempo_factor)
    return audio

def detectar_secciones(texto: str) -> dict:
    texto = texto.strip()
    pi = re.search(r'\[INTRO\](.*?)(?=\[AFIRMACIONES\]|\[MEDITACION\]|$)', texto, re.S | re.I)
    pa = re.search(r'\[AFIRMACIONES\](.*?)(?=\[MEDITACION\]|$)', texto, re.S | re.I)
    pm = re.search(r'\[MEDITACION\](.*)', texto, re.S | re.I)
    if pi or pa or pm:
        return {
            "intro": pi.group(1).strip() if pi else "",
            "afirmaciones": pa.group(1).strip() if pa else "",
            "meditacion": pm.group(1).strip() if pm else ""
        }
    for sep in ["---", "==="]:
        partes = texto.split(sep, 1)
        if len(partes) == 2:
            return {"intro": partes[0].strip(), "afirmaciones": partes[1].strip(), "meditacion": ""}
    lineas = [l.strip() for l in texto.splitlines() if l.strip()]
    intro, afirm, en_afirm = [], [], False
    for linea in lineas:
        if len(linea.split()) <= 20:
            en_afirm = True
        (afirm if en_afirm else intro).append(linea)
    if not intro:
        return {"intro": "", "afirmaciones": "\n".join(afirm), "meditacion": ""}
    return {"intro": " ".join(intro), "afirmaciones": "\n".join(afirm), "meditacion": ""}

def emit_event(job_id: str, event_type: str, data: dict):
    job_events[job_id].append({"type": event_type, "data": data})
    if job_id in jobs:
        jobs[job_id]["last_event"] = {"type": event_type, "data": data}

# =============================================================
#  HELPERS DE REVISIÓN  (reutilizados por intro y afirm)
# =============================================================

def _guardar_preview(audio: "AudioSegment", job_id: str,
                     section: str, index: int) -> str:
    """Exporta el audio procesado a un WAV de preview y devuelve la URL."""
    path = CARPETA_TEMP / f"preview_{job_id}_{section}_{index}.wav"
    audio.export(str(path), format="wav")
    return f"/api/preview/{job_id}/{section}/{index}"

def _esperar_revision(job_id: str, section: str, items: list[str],
                      carpeta: Path, prefijo: str,
                      voice_speed: float, tempo_factor: float,
                      cfg: Config, event_ready: str,
                      event_regenerating: str):
    """
    Bucle de espera que:
      1. Espera decisiones del usuario para la sección indicada.
      2. Regenera los items marcados como 'regenerate' y los vuelve a pending.
      3. Sale cuando todos los items tienen decisión ok/skip.
    """
    decision_key = f"{section}_decisions"
    lock_key     = f"{job_id}_{section}"

    review_event = threading.Event()
    job_locks[lock_key] = review_event

    while True:
        decisions = jobs[job_id].get(decision_key, {})
        pending   = [i for i in range(len(items)) if i not in decisions]

        if not pending:
            break

        review_event.wait(timeout=300)
        review_event.clear()

        # Procesar regeneraciones
        for i in list(decisions.keys()):
            if decisions[i] == "regenerate":
                emit_event(job_id, event_regenerating, {
                    "index": i,
                    "section": section,
                    "message": f"Regenerando segmento {i + 1}..."
                })
                audio = cargar_oracion(
                    items[i], carpeta, prefijo, i,
                    voice_speed, tempo_factor, cfg,
                    force_regen=True
                )
                if audio:
                    audio_url = _guardar_preview(audio, job_id, section, i)
                    del decisions[i]   # vuelve a pending
                    emit_event(job_id, event_ready, {
                        "index": i,
                        "section": section,
                        "text": items[i],
                        "audio_url": audio_url,
                        "message": f"Segmento {i + 1} regenerado"
                    })

# =============================================================
#  JOB DE GENERACIÓN
# =============================================================

def run_generation_job(job_id: str, guion: str, cfg: Config, nombre: str):
    try:
        jobs[job_id]["status"] = "running"
        carpeta = CARPETA_TEMP / nombre
        carpeta.mkdir(parents=True, exist_ok=True)

        secciones   = detectar_secciones(guion)
        tiene_intro = bool(secciones["intro"])
        tiene_afirm = bool(secciones["afirmaciones"])
        tiene_medit = bool(secciones.get("meditacion", ""))

        emit_event(job_id, "start", {
            "tiene_intro": tiene_intro,
            "tiene_afirm": tiene_afirm,
            "tiene_medit": tiene_medit,
            "message": "Iniciando generación..."
        })

        # ── INTRO: generar todos los bloques ──────────────────────────────
        bloques_intro = []
        if tiene_intro:
            parrafos = [p.strip() for p in re.split(r'\n\s*\n', secciones["intro"]) if p.strip()]
            parrafos = [" ".join(p.split()) for p in parrafos]
            for parrafo in parrafos:
                if len(parrafo) <= cfg.max_chars_parrafo:
                    bloques_intro.append(parrafo)
                else:
                    oraciones     = re.split(r'(?<=[.!?])\s+', parrafo)
                    bloque_actual = ""
                    for oracion in oraciones:
                        if len(bloque_actual) + len(oracion) + 1 <= cfg.max_chars_parrafo:
                            bloque_actual += (" " if bloque_actual else "") + oracion
                        else:
                            if bloque_actual:
                                bloques_intro.append(bloque_actual)
                            bloque_actual = oracion
                    if bloque_actual:
                        bloques_intro.append(bloque_actual)

            jobs[job_id]["intro_bloques"]   = bloques_intro
            jobs[job_id]["intro_decisions"] = {}

            emit_event(job_id, "intro_start", {
                "total": len(bloques_intro),
                "message": f"Generando {len(bloques_intro)} segmento(s) de intro..."
            })

            for i, bloque in enumerate(bloques_intro):
                emit_event(job_id, "intro_generating", {
                    "index": i, "total": len(bloques_intro),
                    "text": bloque[:80],
                    "message": f"Intro {i + 1}/{len(bloques_intro)}"
                })
                audio = cargar_oracion(bloque, carpeta, "intro", i,
                                       cfg.intro_voice_speed, cfg.intro_tempo_factor, cfg)
                if audio:
                    audio_url = _guardar_preview(audio, job_id, "intro", i)
                    emit_event(job_id, "intro_ready", {
                        "index": i,
                        "section": "intro",
                        "text": bloque,
                        "audio_url": audio_url,
                        "message": f"Segmento de intro {i + 1} listo"
                    })

            emit_event(job_id, "intro_review_start", {
                "message": "Intro generada. Esperando revisión...",
                "total": len(bloques_intro)
            })
            jobs[job_id]["status"] = "awaiting_review"

            _esperar_revision(
                job_id, "intro", bloques_intro, carpeta, "intro",
                cfg.intro_voice_speed, cfg.intro_tempo_factor, cfg,
                event_ready="intro_ready",
                event_regenerating="intro_regenerating"
            )

            emit_event(job_id, "intro_review_done", {
                "message": "Revisión de intro completada"
            })

        # ── AFIRMACIONES: generar todos los audios ────────────────────────
        afirmaciones = []
        if tiene_afirm:
            afirmaciones = [l.strip() for l in secciones["afirmaciones"].splitlines() if l.strip()]
            jobs[job_id]["afirmaciones"]    = afirmaciones
            jobs[job_id]["afirm_decisions"] = {}

            emit_event(job_id, "afirm_start", {
                "total": len(afirmaciones),
                "message": f"Generando {len(afirmaciones)} afirmaciones..."
            })

            for i, afirm in enumerate(afirmaciones):
                emit_event(job_id, "afirm_generating", {
                    "index": i, "total": len(afirmaciones),
                    "text": afirm[:80],
                    "message": f"Afirmación {i + 1}/{len(afirmaciones)}"
                })
                audio = cargar_oracion(afirm, carpeta, "afirm", i,
                                       cfg.afirm_voice_speed, cfg.afirm_tempo_factor, cfg)
                if audio:
                    audio_url = _guardar_preview(audio, job_id, "afirm", i)
                    emit_event(job_id, "afirm_ready", {
                        "index": i,
                        "section": "afirm",
                        "text": afirm,
                        "audio_url": audio_url,
                        "message": f"Afirmación {i + 1} lista"
                    })

            emit_event(job_id, "afirm_review_start", {
                "message": "Afirmaciones generadas. Esperando revisión...",
                "total": len(afirmaciones)
            })
            jobs[job_id]["status"] = "awaiting_review"

            _esperar_revision(
                job_id, "afirm", afirmaciones, carpeta, "afirm",
                cfg.afirm_voice_speed, cfg.afirm_tempo_factor, cfg,
                event_ready="afirm_ready",
                event_regenerating="afirm_regenerating"
            )

            emit_event(job_id, "afirm_review_done", {
                "message": "Revisión de afirmaciones completada"
            })

        # ── MEDITACIÓN: generar todos los bloques ─────────────────────────
        bloques_medit = []
        if tiene_medit:
            parrafos = [p.strip() for p in re.split(r'\n\s*\n', secciones["meditacion"]) if p.strip()]
            parrafos = [" ".join(p.split()) for p in parrafos]
            for parrafo in parrafos:
                if len(parrafo) <= cfg.max_chars_parrafo:
                    bloques_medit.append(parrafo)
                else:
                    oraciones     = re.split(r'(?<=[.!?])\s+', parrafo)
                    bloque_actual = ""
                    for oracion in oraciones:
                        if len(bloque_actual) + len(oracion) + 1 <= cfg.max_chars_parrafo:
                            bloque_actual += (" " if bloque_actual else "") + oracion
                        else:
                            if bloque_actual:
                                bloques_medit.append(bloque_actual)
                            bloque_actual = oracion
                    if bloque_actual:
                        bloques_medit.append(bloque_actual)

            jobs[job_id]["medit_bloques"]   = bloques_medit
            jobs[job_id]["medit_decisions"] = {}

            emit_event(job_id, "medit_start", {
                "total": len(bloques_medit),
                "message": f"Generando {len(bloques_medit)} segmento(s) de meditación..."
            })

            for i, bloque in enumerate(bloques_medit):
                emit_event(job_id, "medit_generating", {
                    "index": i, "total": len(bloques_medit),
                    "text": bloque[:80],
                    "message": f"Meditación {i + 1}/{len(bloques_medit)}"
                })
                audio = cargar_oracion(bloque, carpeta, "medit", i,
                                       cfg.medit_voice_speed, cfg.medit_tempo_factor, cfg)
                if audio:
                    audio_url = _guardar_preview(audio, job_id, "medit", i)
                    emit_event(job_id, "medit_ready", {
                        "index": i,
                        "section": "medit",
                        "text": bloque,
                        "audio_url": audio_url,
                        "message": f"Segmento de meditación {i + 1} listo"
                    })

            emit_event(job_id, "medit_review_start", {
                "message": "Meditación generada. Esperando revisión...",
                "total": len(bloques_medit)
            })
            jobs[job_id]["status"] = "awaiting_review"

            _esperar_revision(
                job_id, "medit", bloques_medit, carpeta, "medit",
                cfg.medit_voice_speed, cfg.medit_tempo_factor, cfg,
                event_ready="medit_ready",
                event_regenerating="medit_regenerating"
            )

            emit_event(job_id, "medit_review_done", {
                "message": "Revisión de meditación completada"
            })

        # ── ENSAMBLAR AUDIO FINAL ─────────────────────────────────────────
        emit_event(job_id, "building", {"message": "Ensamblando audio final..."})
        jobs[job_id]["status"] = "building"

        audio_final = AudioSegment.empty()

        # Intro aprobada
        if tiene_intro:
            intro_decisions = jobs[job_id].get("intro_decisions", {})
            audio_intro     = AudioSegment.empty()
            last_included   = -1
            for i, bloque in enumerate(bloques_intro):
                if intro_decisions.get(i) == "skip":
                    continue
                path = CARPETA_TEMP / f"preview_{job_id}_intro_{i}.wav"
                if path.exists():
                    seg = AudioSegment.from_file(str(path))
                    if last_included >= 0:
                        audio_intro += silencio(cfg.pausa_entre_oraciones)
                    audio_intro  += seg
                    last_included = i
            audio_final += audio_intro
            if tiene_afirm and len(audio_intro) > 0:
                audio_final += silencio(cfg.pausa_intro_a_afirm)

        # Afirmaciones aprobadas
        if tiene_afirm:
            afirm_decisions = jobs[job_id].get("afirm_decisions", {})
            audio_afirm     = AudioSegment.empty()
            last_included   = -1
            for i, afirm in enumerate(afirmaciones):
                if afirm_decisions.get(i) == "skip":
                    continue
                path = CARPETA_TEMP / f"preview_{job_id}_afirm_{i}.wav"
                if path.exists():
                    seg = AudioSegment.from_file(str(path))
                    if last_included >= 0:
                        audio_afirm += silencio(cfg.pausa_entre_afirmaciones)
                    audio_afirm   += seg
                    last_included  = i
            audio_final += audio_afirm
            if tiene_medit and len(audio_afirm) > 0:
                audio_final += silencio(cfg.pausa_afirm_a_medit)

        # Meditación aprobada
        if tiene_medit:
            medit_decisions = jobs[job_id].get("medit_decisions", {})
            audio_medit     = AudioSegment.empty()
            last_included   = -1
            for i, bloque in enumerate(bloques_medit):
                if medit_decisions.get(i) == "skip":
                    continue
                path = CARPETA_TEMP / f"preview_{job_id}_medit_{i}.wav"
                if path.exists():
                    seg = AudioSegment.from_file(str(path))
                    if last_included >= 0:
                        audio_medit += silencio(cfg.pausa_entre_meditaciones)
                    audio_medit   += seg
                    last_included  = i
            audio_final += audio_medit

        if len(audio_final) == 0:
            emit_event(job_id, "error", {"message": "Audio vacío. Verifica API key y guion."})
            jobs[job_id]["status"] = "error"
            return

        ruta_salida = CARPETA_SALIDA / f"{nombre}.wav"
        audio_final.export(str(ruta_salida), format="wav")
        mins = len(audio_final) / 60_000

        jobs[job_id]["status"]       = "done"
        jobs[job_id]["output_file"]  = str(ruta_salida)
        jobs[job_id]["duration_mins"] = round(mins, 1)

        emit_event(job_id, "done", {
            "message": f"Audio generado: {mins:.1f} min",
            "download_url": f"/api/download/{job_id}",
            "duration_mins": round(mins, 1)
        })

    except Exception as e:
        jobs[job_id]["status"] = "error"
        emit_event(job_id, "error", {"message": str(e)})

# =============================================================
#  ENDPOINTS
# =============================================================

@app.get("/api/health")
def health():
    return {"ok": True, "pydub": PYDUB_AVAILABLE}


@app.post("/api/generate")
def start_generation(req: GenerateRequest, background_tasks: BackgroundTasks):
    if not PYDUB_AVAILABLE:
        raise HTTPException(500, "pydub no instalado. Ejecuta: pip install pydub audioop-lts")

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "id": job_id,
        "status": "queued",
        "nombre": req.nombre,
        "config": req.config.model_dump(),
        "created_at": time.time(),
    }
    job_events[job_id] = []

    background_tasks.add_task(
        run_generation_job, job_id, req.guion, req.config, req.nombre
    )
    return {"job_id": job_id}


@app.get("/api/events/{job_id}")
def stream_events(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job no encontrado")

    def event_generator():
        last_sent = 0
        while True:
            events     = job_events.get(job_id, [])
            new_events = events[last_sent:]
            for evt in new_events:
                yield f"data: {json.dumps(evt)}\n\n"
                last_sent += 1

            status = jobs.get(job_id, {}).get("status", "")
            if status in ("done", "error"):
                break
            time.sleep(0.4)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@app.get("/api/job/{job_id}")
def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job no encontrado")
    job = dict(jobs[job_id])
    return job


@app.get("/api/preview/{job_id}/{section}/{index}")
def get_preview(job_id: str, section: str, index: int):
    path = CARPETA_TEMP / f"preview_{job_id}_{section}_{index}.wav"
    if not path.exists():
        raise HTTPException(404, "Preview no disponible")
    return FileResponse(str(path), media_type="audio/wav")


@app.post("/api/review")
def submit_review(decision: ReviewDecision):
    job_id  = decision.job_id
    section = decision.section   # "intro" | "afirm"
    index   = decision.index

    if job_id not in jobs:
        raise HTTPException(404, "Job no encontrado")

    decision_key = f"{section}_decisions"
    if decision_key not in jobs[job_id]:
        jobs[job_id][decision_key] = {}

    # Si se provee nuevo texto, actualizar el array del job antes de regenerar
    if decision.new_text and decision.new_text.strip():
        array_key = {"intro": "intro_bloques", "afirm": "afirmaciones", "medit": "medit_bloques"}.get(section, "afirmaciones")
        if array_key in jobs[job_id] and index < len(jobs[job_id][array_key]):
            jobs[job_id][array_key][index] = decision.new_text.strip()

    jobs[job_id][decision_key][index] = decision.decision

    # Despertar el lock de la sección correspondiente
    lock_key = f"{job_id}_{section}"
    if lock_key in job_locks:
        job_locks[lock_key].set()

    return {"ok": True}


@app.post("/api/finalize/{job_id}/{section}")
def finalize_section(job_id: str, section: str):
    """Señaliza que el usuario terminó de revisar una sección."""
    if job_id not in jobs:
        raise HTTPException(404, "Job no encontrado")
    lock_key = f"{job_id}_{section}"
    if lock_key in job_locks:
        job_locks[lock_key].set()
    return {"ok": True}


@app.get("/api/download/{job_id}")
def download(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job no encontrado")
    output = jobs[job_id].get("output_file")
    if not output or not Path(output).exists():
        raise HTTPException(404, "Archivo no disponible aún")
    nombre = jobs[job_id].get("nombre", "meditacion")
    return FileResponse(output, media_type="audio/wav", filename=f"{nombre}.wav")


@app.get("/api/history")
def get_history():
    archivos = sorted(
        CARPETA_SALIDA.glob("*.wav"),
        key=lambda f: f.stat().st_mtime,
        reverse=True
    )
    history = []
    for f in archivos:
        stat = f.stat()
        history.append({
            "name": f.stem,
            "filename": f.name,
            "size_mb": round(stat.st_size / 1_048_576, 2),
            "created_at": stat.st_mtime,
            "download_url": f"/api/history/download/{f.name}"
        })
    return history


@app.get("/api/history/download/{filename}")
def download_history(filename: str):
    path = CARPETA_SALIDA / filename
    if not path.exists():
        raise HTTPException(404)
    return FileResponse(str(path), media_type="audio/wav", filename=filename)


@app.delete("/api/history/{filename}")
def delete_history(filename: str):
    path = CARPETA_SALIDA / filename
    if path.exists():
        path.unlink()
    return {"ok": True}


@app.get("/api/voices")
def get_voices(api_key: str):
    try:
        r = requests.get(
            "https://api.elevenlabs.io/v1/voices",
            headers={"xi-api-key": api_key},
            timeout=10
        )
        if r.status_code == 200:
            voices = r.json().get("voices", [])
            return [{"id": v["voice_id"], "name": v["name"]} for v in voices]
    except Exception:
        pass
    return []