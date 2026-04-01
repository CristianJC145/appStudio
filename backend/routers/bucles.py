"""
Router del módulo Bucles de Video.
Flujo: DALL-E 3 (imagen) → GPT-Image-1 (mejora) → ffmpeg (bucle con Ken Burns).
Grok (xAI) analiza la imagen mejorada para determinar los parámetros de movimiento óptimos.
"""

import os
import re
import json
import uuid
import time
import base64
import hashlib
import shutil
import subprocess
import threading
from pathlib import Path
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/bucles")

# ── Directorios persistentes ──────────────────────────────────
DATA_DIR     = Path("data") / "bucles"
LIBRARY_DIR  = DATA_DIR / "library"
GEN_DIR      = DATA_DIR / "generated"
LOOPS_DIR    = DATA_DIR / "loops"

for d in [LIBRARY_DIR, GEN_DIR, LOOPS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ── Estado en memoria de jobs activos ─────────────────────────
loop_jobs: dict = {}   # { job_id: { status, progress, url, error } }


# =============================================================
#  MODELOS
# =============================================================

class GenerateImagesRequest(BaseModel):
    script:       str
    n_images:     int   = 3          # 1–5
    openai_key:   str
    style_hint:   str   = ""         # instrucción extra del usuario
    library_ids:  list[str] = []     # IDs de library para dar contexto

class EnhanceImageRequest(BaseModel):
    image_id:   str
    openai_key: str

class GenerateLoopRequest(BaseModel):
    image_id:   str
    grok_key:   str   = ""          # si vacío, omite la fase Grok
    duration_s: int   = 30          # segundos del bucle: 15, 30, 60, 120, 300
    format:     str   = "mp4"       # mp4 | webm
    quality:    str   = "hd"        # sd | hd | 4k
    fps:        int   = 30          # 24 | 30 | 60
    motion:     str   = "suave"     # suave | moderado | dinamico

class SaveToLibraryRequest(BaseModel):
    image_id: str
    tags:     str = ""              # etiquetas separadas por coma


# =============================================================
#  HELPERS DE IMAGEN
# =============================================================

def _image_to_b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()


def _build_dalle_prompt(script: str, style_desc: str, style_hint: str, openai_key: str) -> str:
    """
    Usa GPT-4o-mini para construir un prompt DALL-E 3 optimizado
    basado en el guion, la descripción de estilo de la biblioteca y el hint del usuario.
    """
    system = (
        "Eres un experto en prompts para DALL-E 3. "
        "Recibirás el guion de una meditación o contenido de bienestar y, opcionalmente, "
        "una descripción del estilo visual que se usa en la biblioteca de imágenes del proyecto. "
        "Genera un único prompt en inglés, detallado y evocador, que capture la esencia del guion "
        "pero adaptado al formato visual requerido: imágenes de fondo para bucles de video de meditación. "
        "Las imágenes deben ser: cinematográficas, serenas, con profundidad de campo, paleta de colores cálida "
        "o etérea, sin texto, sin personas si no es necesario, inspiradoras y tranquilizadoras. "
        "El prompt no debe superar 900 caracteres. Responde SOLO con el prompt, sin explicaciones."
    )
    user_parts = [f"GUION:\n{script[:1500]}"]
    if style_desc:
        user_parts.append(f"ESTILO DE BIBLIOTECA:\n{style_desc}")
    if style_hint:
        user_parts.append(f"INSTRUCCIÓN ADICIONAL: {style_hint}")

    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": "\n\n".join(user_parts)},
                ],
                "max_tokens": 400,
                "temperature": 0.8,
            },
            timeout=30,
        )
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        pass

    # Fallback: prompt genérico basado en palabras clave del guion
    words = re.findall(r'\b\w{5,}\b', script[:500])
    keywords = ", ".join(list(dict.fromkeys(words))[:8])
    return (
        f"Cinematic meditation background, serene landscape inspired by {keywords}, "
        "golden hour light, soft bokeh, ethereal atmosphere, no text, photorealistic, 4K"
    )


def _describe_library_style(library_ids: list[str], openai_key: str) -> str:
    """
    Envía miniaturas de la biblioteca a GPT-4o-mini para extraer
    una descripción de estilo visual consistente.
    """
    if not library_ids or not openai_key:
        return ""

    images_content = []
    for lid in library_ids[:4]:   # máx 4 para no exceder tokens
        meta_path = LIBRARY_DIR / f"{lid}.json"
        img_path  = LIBRARY_DIR / f"{lid}.png"
        if img_path.exists() and meta_path.exists():
            b64 = _image_to_b64(img_path)
            images_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "low"},
            })

    if not images_content:
        return ""

    try:
        messages = [
            {"role": "system", "content": (
                "Analiza las imágenes de referencia y describe en 2-3 frases el estilo visual: "
                "paleta de colores, iluminación, atmósfera, tipo de composición. "
                "Responde en inglés, de forma concisa y técnica para usarse en un prompt de DALL-E."
            )},
            {"role": "user", "content": [
                {"type": "text", "text": "Describe el estilo visual de estas imágenes de referencia:"},
                *images_content,
            ]},
        ]
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json={"model": "gpt-4o-mini", "messages": messages, "max_tokens": 200},
            timeout=30,
        )
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        pass
    return ""


def _generate_dalle_image(prompt: str, openai_key: str, quality: str = "hd") -> Optional[bytes]:
    """Genera una imagen con DALL-E 3 y devuelve los bytes PNG."""
    try:
        r = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json={
                "model":   "dall-e-3",
                "prompt":  prompt,
                "n":       1,
                "size":    "1792x1024",   # landscape — ideal para fondos de video
                "quality": quality,       # "hd" o "standard"
                "response_format": "b64_json",
            },
            timeout=90,
        )
        if r.status_code == 200:
            b64 = r.json()["data"][0]["b64_json"]
            return base64.b64decode(b64)
    except Exception:
        pass
    return None


def _enhance_with_gpt_image(image_path: Path, openai_key: str) -> Optional[bytes]:
    """
    Usa gpt-image-1 para mejorar la calidad de la imagen existente.
    Envía la imagen y pide una versión de mayor resolución y detalle.
    """
    try:
        b64 = _image_to_b64(image_path)
        r = requests.post(
            "https://api.openai.com/v1/images/edits",
            headers={"Authorization": f"Bearer {openai_key}"},
            files={"image": ("image.png", image_path.read_bytes(), "image/png")},
            data={
                "model":  "gpt-image-1",
                "prompt": (
                    "Enhance this image: increase sharpness, improve color grading with cinematic tones, "
                    "add subtle depth-of-field effect, make it look more professional and atmospheric. "
                    "Keep the same composition and subject. No text."
                ),
                "n":    1,
                "size": "1536x1024",
                "response_format": "b64_json",
            },
            timeout=120,
        )
        if r.status_code == 200:
            b64_out = r.json()["data"][0]["b64_json"]
            return base64.b64decode(b64_out)
    except Exception:
        pass
    return None


# =============================================================
#  HELPERS DE BUCLE (ffmpeg + Grok opcional)
# =============================================================

_QUALITY_MAP = {
    "sd":  {"scale": "1280:720",  "crf": "23", "bitrate": "2M"},
    "hd":  {"scale": "1920:1080", "crf": "20", "bitrate": "5M"},
    "4k":  {"scale": "3840:2160", "crf": "18", "bitrate": "12M"},
}

_MOTION_PARAMS = {
    "suave":    {"zoom_speed": 0.0003, "pan_speed": 0.15},
    "moderado": {"zoom_speed": 0.0006, "pan_speed": 0.30},
    "dinamico": {"zoom_speed": 0.0012, "pan_speed": 0.55},
}


def _grok_motion_params(image_path: Path, grok_key: str, motion: str) -> dict:
    """
    Llama a Grok (xAI) para analizar la imagen y sugerir
    los mejores parámetros de movimiento para el bucle.
    """
    if not grok_key:
        return _MOTION_PARAMS.get(motion, _MOTION_PARAMS["suave"])

    try:
        b64 = _image_to_b64(image_path)
        r = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {grok_key}", "Content-Type": "application/json"},
            json={
                "model": "grok-2-vision-latest",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{b64}",
                                    "detail": "low",
                                },
                            },
                            {
                                "type": "text",
                                "text": (
                                    f"Analyze this meditation/wellness background image. "
                                    f"The user wants a '{motion}' motion loop. "
                                    "Respond ONLY with a JSON object with these fields: "
                                    "zoom_speed (float 0.0001-0.002), pan_speed (float 0.05-0.8), "
                                    "pan_direction ('left'|'right'|'up'|'down'|'diagonal'), "
                                    "zoom_direction ('in'|'out'), "
                                    "reason (short string). "
                                    "Consider the image composition to choose the best focal point for motion."
                                ),
                            },
                        ],
                    }
                ],
                "max_tokens": 200,
                "temperature": 0.3,
            },
            timeout=30,
        )
        if r.status_code == 200:
            content = r.json()["choices"][0]["message"]["content"]
            # Extraer JSON de la respuesta
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                params = json.loads(match.group())
                return {
                    "zoom_speed":     float(params.get("zoom_speed",     0.0003)),
                    "pan_speed":      float(params.get("pan_speed",      0.15)),
                    "pan_direction":  params.get("pan_direction", "right"),
                    "zoom_direction": params.get("zoom_direction", "in"),
                }
    except Exception:
        pass

    return _MOTION_PARAMS.get(motion, _MOTION_PARAMS["suave"])


def _build_ken_burns_filter(
    duration_s: int, fps: int, zoom_speed: float, pan_speed: float,
    pan_direction: str = "right", zoom_direction: str = "in",
) -> str:
    """
    Construye el filtro zoompan de ffmpeg para el efecto Ken Burns.
    El bucle es seamless: empieza y termina en el mismo frame.
    """
    total_frames = duration_s * fps
    # zoom: oscila suavemente entre 1 y max_zoom (seamless via función seno)
    max_zoom = 1 + zoom_speed * total_frames

    # Dirección del paneo
    pan_map = {
        "right":    ("x", "+"),
        "left":     ("x", "-"),
        "up":       ("y", "-"),
        "down":     ("y", "+"),
        "diagonal": ("xy", "+"),
    }
    axis, sign = pan_map.get(pan_direction, ("x", "+"))

    # Para zoom seamless usamos expresión trigonométrica
    if zoom_direction == "out":
        zoom_expr = f"if(lte(zoom,1),{max_zoom:.4f},{max_zoom:.4f}-{zoom_speed:.6f}*on)"
    else:
        zoom_expr = f"if(lte(on,1),1,min({max_zoom:.4f},zoom+{zoom_speed:.6f}))"

    # Pan en pixels — suave y seamless
    pan_px = int(pan_speed * 100)
    if axis == "xy":
        x_expr = f"trunc(iw/2-(iw/zoom/2))+{pan_px}*sin(2*PI*on/{total_frames})"
        y_expr = f"trunc(ih/2-(ih/zoom/2))+{pan_px//2}*sin(2*PI*on/{total_frames}+PI/4)"
    elif axis == "x":
        sign_mult = 1 if sign == "+" else -1
        x_expr = f"trunc(iw/2-(iw/zoom/2))+{sign_mult * pan_px}*sin(2*PI*on/{total_frames})"
        y_expr = "trunc(ih/2-(ih/zoom/2))"
    else:
        x_expr = "trunc(iw/2-(iw/zoom/2))"
        sign_mult = 1 if sign == "+" else -1
        y_expr = f"trunc(ih/2-(ih/zoom/2))+{sign_mult * pan_px}*sin(2*PI*on/{total_frames})"

    return (
        f"zoompan=z='{zoom_expr}':x='{x_expr}':y='{y_expr}':"
        f"d={total_frames}:s=1920x1080:fps={fps}"
    )


def _run_loop_job(job_id: str, image_path: Path, req: GenerateLoopRequest):
    """Función que corre en background thread."""
    try:
        loop_jobs[job_id] = {"status": "processing", "progress": 5, "url": None, "error": None}

        # 1. Obtener parámetros de movimiento (Grok si hay key)
        loop_jobs[job_id]["progress"] = 10
        motion_params = _grok_motion_params(image_path, req.grok_key, req.motion)

        loop_jobs[job_id]["progress"] = 20
        q = _QUALITY_MAP.get(req.quality, _QUALITY_MAP["hd"])
        output_path = LOOPS_DIR / f"{job_id}.{req.format}"

        # 2. Construir filtro zoompan
        vf = _build_ken_burns_filter(
            req.duration_s, req.fps,
            motion_params.get("zoom_speed", 0.0003),
            motion_params.get("pan_speed",  0.15),
            motion_params.get("pan_direction",  "right"),
            motion_params.get("zoom_direction", "in"),
        )

        loop_jobs[job_id]["progress"] = 30

        # 3. Ejecutar ffmpeg
        vcodec = "libx264" if req.format == "mp4" else "libvpx-vp9"
        acodec = "aac"     if req.format == "mp4" else "libopus"

        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", str(image_path),
            "-vf", f"scale={q['scale']}:flags=lanczos,{vf},format=yuv420p",
            "-c:v", vcodec,
            "-crf", q["crf"],
            "-b:v", q["bitrate"],
            "-t", str(req.duration_s),
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            str(output_path),
        ]
        proc = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        # Estimar progreso leyendo stderr
        for line in proc.stderr:
            line = line.decode(errors="ignore")
            if "time=" in line:
                m = re.search(r'time=(\d+):(\d+):(\d+)', line)
                if m:
                    secs = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
                    pct  = min(90, 30 + int(60 * secs / req.duration_s))
                    loop_jobs[job_id]["progress"] = pct
        proc.wait()

        if proc.returncode != 0 or not output_path.exists():
            raise RuntimeError("ffmpeg falló al generar el bucle")

        loop_jobs[job_id] = {
            "status":   "done",
            "progress": 100,
            "url":      f"/api/bucles/loop-file/{job_id}/{job_id}.{req.format}",
            "error":    None,
        }

    except Exception as e:
        loop_jobs[job_id] = {
            "status": "error", "progress": 0,
            "url": None, "error": str(e),
        }


# =============================================================
#  ENDPOINTS
# =============================================================

@router.post("/generate-images")
def generate_images(req: GenerateImagesRequest):
    """
    Genera N imágenes con DALL-E 3 usando el guion y el contexto de la biblioteca.
    Devuelve SSE con un evento por imagen.
    """
    n = max(1, min(5, req.n_images))

    def stream():
        # Paso 1: extraer estilo de la biblioteca
        yield f"data: {json.dumps({'event': 'status', 'message': 'Analizando biblioteca de estilos...'})}\n\n"
        style_desc = _describe_library_style(req.library_ids, req.openai_key)

        # Paso 2: construir prompt
        yield f"data: {json.dumps({'event': 'status', 'message': 'Construyendo prompt creativo...'})}\n\n"
        base_prompt = _build_dalle_prompt(req.script, style_desc, req.style_hint, req.openai_key)

        # Paso 3: generar N imágenes
        for idx in range(n):
            yield f"data: {json.dumps({'event': 'generating', 'index': idx, 'total': n, 'message': f'Generando imagen {idx + 1} de {n}...'})}\n\n"

            # Variamos ligeramente el prompt para obtener variedad
            variation = "" if idx == 0 else f" (variation {idx + 1}, slightly different mood and composition)"
            prompt = base_prompt + variation

            img_bytes = _generate_dalle_image(prompt, req.openai_key)
            if img_bytes:
                image_id  = uuid.uuid4().hex[:16]
                img_path  = GEN_DIR / f"{image_id}.png"
                img_path.write_bytes(img_bytes)
                # Guardar metadata
                meta = {"id": image_id, "prompt": prompt, "created_at": int(time.time()), "enhanced": False}
                (GEN_DIR / f"{image_id}.json").write_text(json.dumps(meta))

                yield f"data: {json.dumps({'event': 'image_ready', 'index': idx, 'image_id': image_id, 'url': f'/api/bucles/image/{image_id}', 'prompt': prompt[:120] + '...'})}\n\n"
            else:
                yield f"data: {json.dumps({'event': 'image_error', 'index': idx, 'message': f'Error generando imagen {idx + 1}'})}\n\n"

        yield f"data: {json.dumps({'event': 'done', 'message': 'Generación completada'})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/enhance-image")
def enhance_image(req: EnhanceImageRequest):
    """Mejora la calidad de una imagen generada usando gpt-image-1."""
    img_path = GEN_DIR / f"{req.image_id}.png"
    if not img_path.exists():
        raise HTTPException(404, "Imagen no encontrada")

    enhanced = _enhance_with_gpt_image(img_path, req.openai_key)
    if not enhanced:
        raise HTTPException(500, "Error al mejorar la imagen")

    # Guardar versión mejorada (reemplaza la original)
    img_path.write_bytes(enhanced)
    meta_path = GEN_DIR / f"{req.image_id}.json"
    if meta_path.exists():
        meta = json.loads(meta_path.read_text())
        meta["enhanced"] = True
        meta_path.write_text(json.dumps(meta))

    return {"image_id": req.image_id, "url": f"/api/bucles/image/{req.image_id}?t={int(time.time())}"}


@router.post("/generate-loop")
def generate_loop(req: GenerateLoopRequest, background_tasks: BackgroundTasks):
    """Inicia la generación del bucle de video en background."""
    img_path = GEN_DIR / f"{req.image_id}.png"
    if not img_path.exists():
        raise HTTPException(404, "Imagen no encontrada")

    job_id = uuid.uuid4().hex[:12]
    loop_jobs[job_id] = {"status": "queued", "progress": 0, "url": None, "error": None}
    background_tasks.add_task(_run_loop_job, job_id, img_path, req)
    return {"job_id": job_id}


@router.get("/loop-status/{job_id}")
def loop_status(job_id: str):
    """SSE con el estado del job de generación del bucle."""
    def stream():
        for _ in range(600):   # timeout 10 min
            job = loop_jobs.get(job_id, {"status": "not_found"})
            yield f"data: {json.dumps(job)}\n\n"
            if job.get("status") in ("done", "error", "not_found"):
                break
            time.sleep(1)

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/loop-file/{job_id}/{filename}")
def serve_loop(job_id: str, filename: str):
    path = LOOPS_DIR / filename
    if not path.exists():
        raise HTTPException(404, "Bucle no encontrado")
    media_type = "video/mp4" if filename.endswith(".mp4") else "video/webm"
    return FileResponse(str(path), media_type=media_type)


@router.get("/image/{image_id}")
def serve_image(image_id: str):
    # Buscar en generadas y en biblioteca
    for directory in [GEN_DIR, LIBRARY_DIR]:
        path = directory / f"{image_id}.png"
        if path.exists():
            return FileResponse(str(path), media_type="image/png")
    raise HTTPException(404, "Imagen no encontrada")


# ── Biblioteca ────────────────────────────────────────────────

@router.get("/library")
def get_library():
    items = []
    for meta_file in sorted(LIBRARY_DIR.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True):
        try:
            meta = json.loads(meta_file.read_text())
            if (LIBRARY_DIR / f"{meta['id']}.png").exists():
                items.append(meta)
        except Exception:
            pass
    return {"items": items}


@router.post("/library/save")
def save_to_library(req: SaveToLibraryRequest):
    src_img  = GEN_DIR / f"{req.image_id}.png"
    src_meta = GEN_DIR / f"{req.image_id}.json"
    if not src_img.exists():
        raise HTTPException(404, "Imagen no encontrada")

    dst_img  = LIBRARY_DIR / f"{req.image_id}.png"
    dst_meta = LIBRARY_DIR / f"{req.image_id}.json"
    shutil.copy2(src_img, dst_img)

    meta = json.loads(src_meta.read_text()) if src_meta.exists() else {"id": req.image_id}
    meta["tags"] = req.tags
    meta["saved_at"] = int(time.time())
    dst_meta.write_text(json.dumps(meta))

    return {"ok": True, "image_id": req.image_id}


@router.post("/library/upload")
async def upload_to_library(
    file: UploadFile = File(...),
    tags: str        = Form(""),
):
    """Sube una imagen directamente a la biblioteca (JPEG/PNG/WEBP → PNG)."""
    ct = file.content_type or ""
    if ct not in ("image/jpeg", "image/png", "image/webp", "image/jpg"):
        raise HTTPException(400, "Formato no soportado. Usa JPG, PNG o WEBP.")

    image_id  = uuid.uuid4().hex[:16]
    raw_bytes = await file.read()

    # Convertir a PNG normalizado con Pillow si está disponible, si no guardar directo
    try:
        from PIL import Image as PilImage
        import io
        img = PilImage.open(io.BytesIO(raw_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        png_bytes = buf.getvalue()
    except Exception:
        png_bytes = raw_bytes   # fallback: guardar tal cual

    dst_img  = LIBRARY_DIR / f"{image_id}.png"
    dst_meta = LIBRARY_DIR / f"{image_id}.json"
    dst_img.write_bytes(png_bytes)
    meta = {
        "id":         image_id,
        "tags":       tags,
        "source":     "upload",
        "filename":   file.filename or "",
        "created_at": int(time.time()),
        "saved_at":   int(time.time()),
    }
    dst_meta.write_text(json.dumps(meta))
    return {"ok": True, "image_id": image_id, "url": f"/api/bucles/image/{image_id}"}


@router.get("/library/count")
def library_count():
    """Devuelve solo el total de imágenes en biblioteca (para gate en frontend)."""
    total = sum(1 for f in LIBRARY_DIR.glob("*.png"))
    return {"count": total}


@router.delete("/library/{image_id}")
def delete_from_library(image_id: str):
    for ext in [".png", ".json"]:
        p = LIBRARY_DIR / f"{image_id}{ext}"
        if p.exists():
            p.unlink()
    return {"ok": True}
