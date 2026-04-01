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


def _build_content_prompt(script: str, style_hint: str, openai_key: str) -> str:
    """
    Usa GPT-4o para construir un prompt de contenido (qué mostrar) a partir del guion.
    NO describe el estilo — ese lo aportarán las imágenes de referencia directamente.
    """
    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": (
                        "You are an expert at creating image generation prompts for meditation/wellness video backgrounds. "
                        "Extract the THEME and VISUAL CONTENT from the script: what landscape, elements, atmosphere, "
                        "and mood should be depicted. Do NOT describe style, colors, or technique — only what to show. "
                        "Write in English. Maximum 200 characters. Reply with ONLY the content description."
                    )},
                    {"role": "user", "content": (
                        f"Script:\n{script[:1200]}"
                        + (f"\n\nAdditional instruction: {style_hint}" if style_hint else "")
                    )},
                ],
                "max_tokens": 120,
                "temperature": 0.7,
            },
            timeout=20,
        )
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        pass
    # Fallback
    words = re.findall(r'\b\w{5,}\b', script[:400])
    return ", ".join(list(dict.fromkeys(words))[:6]) + ", serene landscape, meditation background"


def _get_library_image_paths(library_ids: list[str]) -> list[Path]:
    """Devuelve paths válidos de imágenes de biblioteca (prioriza las seleccionadas, luego rellena con el resto)."""
    paths = []
    # Primero los seleccionados explícitamente
    for lid in library_ids:
        p = LIBRARY_DIR / f"{lid}.png"
        if p.exists():
            paths.append(p)
    # Completar hasta 4 con otras de la biblioteca si hacen falta
    if len(paths) < 4:
        for p in sorted(LIBRARY_DIR.glob("*.png"), key=lambda f: f.stat().st_mtime, reverse=True):
            img_id = p.stem
            if img_id not in library_ids and p not in paths:
                paths.append(p)
            if len(paths) >= 4:
                break
    return paths[:4]


def _style_description_from_refs(ref_paths: list[Path], openai_key: str) -> str:
    """
    Analiza visualmente las imágenes de referencia con GPT-4o Vision y extrae
    una descripción de estilo MUY detallada: paleta exacta, texturas, iluminación,
    composición, renderizado, atmósfera. Mucho más precisa que un resumen genérico.
    """
    content = []
    for rp in ref_paths[:4]:
        b64 = _image_to_b64(rp)
        content.append({
            "type":      "image_url",
            "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "high"},
        })
    content.append({"type": "text", "text": (
        "Analyze these reference images in extreme detail for use as a DALL-E 3 style guide. "
        "Describe PRECISELY: exact color palette (name specific hues and tones), "
        "lighting type (golden hour / blue hour / overcast / studio / etc.), "
        "rendering style (photorealistic / painterly / 3D render / watercolor / etc.), "
        "texture and grain, depth of field, atmospheric effects (fog / glow / rays / etc.), "
        "composition rules used, overall mood and emotion. "
        "Be extremely specific and technical. Write in English. Max 350 words."
    )})
    try:
        r = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json={
                "model":       "gpt-4o",
                "messages":    [{"role": "user", "content": content}],
                "max_tokens":  500,
                "temperature": 0.2,   # bajo → descripción consistente y precisa
            },
            timeout=30,
        )
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        pass
    return ""


def _generate_with_visual_references(
    content_prompt: str,
    ref_paths: list[Path],
    variation_idx: int,
    openai_key: str,
) -> tuple[Optional[bytes], str]:
    """
    Genera una imagen con DALL-E 3 guiada visualmente por las referencias.
    Estrategia: GPT-4o Vision describe el estilo con alta fidelidad →
    ese estilo + el contenido del guion se combinan en un prompt DALL-E 3 preciso.

    Returns: (bytes | None, error_message)
    """
    variation_seeds = [
        "exact same visual style as references",
        "same style, slightly different framing and depth of field",
        "same style, alternative time of day lighting",
        "same style, wider composition",
        "same style, more abstract / textural interpretation",
    ]
    variation_note = variation_seeds[min(variation_idx, len(variation_seeds) - 1)]

    # 1. Descripción visual detallada de las referencias
    style_desc = _style_description_from_refs(ref_paths, openai_key)
    if not style_desc:
        return None, "No se pudo analizar el estilo de las referencias"

    # 2. Construir prompt DALL-E 3 completo
    prompt = (
        f"STYLE (match exactly): {style_desc}\n\n"
        f"CONTENT: {content_prompt}\n\n"
        f"REQUIREMENTS: {variation_note}. "
        "Landscape orientation (16:9), meditation video background, "
        "no text, no watermarks, no people unless style demands it."
    )
    # DALL-E 3 acepta hasta 4000 caracteres
    prompt = prompt[:3900]

    # 3. Generar con DALL-E 3
    try:
        r = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json={
                "model":           "dall-e-3",
                "prompt":          prompt,
                "n":               1,
                "size":            "1792x1024",
                "quality":         "hd",
                "response_format": "b64_json",
            },
            timeout=90,
        )
        if r.status_code == 200:
            b64 = r.json()["data"][0]["b64_json"]
            return base64.b64decode(b64), ""
        else:
            err = r.json().get("error", {}).get("message", f"HTTP {r.status_code}")
            return None, err
    except Exception as e:
        return None, str(e)


def _generate_dalle_fallback(content_prompt: str, openai_key: str) -> tuple[Optional[bytes], str]:
    """DALL-E 3 sin referencias (cuando la biblioteca está vacía)."""
    full_prompt = (
        f"Cinematic meditation background, {content_prompt}. "
        "Photorealistic, golden hour light, soft depth of field, atmospheric haze, "
        "rich color grading, no text, no watermarks, landscape 16:9, 4K quality."
    )
    try:
        r = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json={
                "model":           "dall-e-3",
                "prompt":          full_prompt,
                "n":               1,
                "size":            "1792x1024",
                "quality":         "hd",
                "response_format": "b64_json",
            },
            timeout=90,
        )
        if r.status_code == 200:
            b64 = r.json()["data"][0]["b64_json"]
            return base64.b64decode(b64), ""
        else:
            err = r.json().get("error", {}).get("message", f"HTTP {r.status_code}")
            return None, err
    except Exception as e:
        return None, str(e)


def _enhance_with_gpt_image(image_path: Path, openai_key: str) -> Optional[bytes]:
    """
    Mejora la imagen usando gpt-image-1 via /v1/images/edits.
    Toma la imagen generada y produce una versión de mayor calidad cinematográfica.
    """
    try:
        with open(image_path, "rb") as f:
            r = requests.post(
                "https://api.openai.com/v1/images/edits",
                headers={"Authorization": f"Bearer {openai_key}"},
                files={"image": (image_path.name, f, "image/png")},
                data={
                    "model":  "gpt-image-1",
                    "prompt": (
                        "Enhance this image: improve cinematic color grading, "
                        "add richer atmospheric depth and lighting quality, "
                        "increase visual sharpness and professional finish. "
                        "Keep exact same composition and subject. No text."
                    ),
                    "size": "1536x1024",
                },
                timeout=120,
            )
        if r.status_code == 200:
            data = r.json()
            # gpt-image-1 devuelve b64_json
            b64_out = data.get("data", [{}])[0].get("b64_json", "")
            if b64_out:
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
    Genera N imágenes usando la Responses API de OpenAI con referencias visuales directas.
    Cuando hay imágenes en la biblioteca, gpt-image-1 ve el estilo real — no una descripción textual.
    Sin referencias usa DALL-E 3 como fallback.
    """
    n = max(1, min(5, req.n_images))

    def stream():
        # Paso 1: extraer rutas de referencias visuales
        yield f"data: {json.dumps({'event': 'status', 'message': 'Preparando referencias visuales...'})}\n\n"
        ref_paths = _get_library_image_paths(req.library_ids)
        use_references = len(ref_paths) > 0

        # Paso 2: construir descripción de contenido (qué mostrar, no cómo)
        yield f"data: {json.dumps({'event': 'status', 'message': 'Analizando guion...'})}\n\n"
        content_prompt = _build_content_prompt(req.script, req.style_hint, req.openai_key)

        method = f"estilo de {len(ref_paths)} referencias" if use_references else "DALL-E 3 (sin referencias)"
        yield f"data: {json.dumps({'event': 'status', 'message': f'Generando con {method}...'})}\n\n"

        # Paso 3: generar N imágenes
        for idx in range(n):
            yield f"data: {json.dumps({'event': 'generating', 'index': idx, 'total': n, 'message': f'Generando imagen {idx + 1} de {n}...'})}\n\n"

            if use_references:
                img_bytes, err = _generate_with_visual_references(
                    content_prompt, ref_paths, idx, req.openai_key
                )
            else:
                img_bytes, err = _generate_dalle_fallback(content_prompt, req.openai_key)

            if img_bytes:
                image_id = uuid.uuid4().hex[:16]
                img_path = GEN_DIR / f"{image_id}.png"
                img_path.write_bytes(img_bytes)
                meta = {
                    "id": image_id, "prompt": content_prompt,
                    "created_at": int(time.time()), "enhanced": False,
                    "method": "visual_references" if use_references else "dalle3",
                    "n_refs": len(ref_paths),
                }
                (GEN_DIR / f"{image_id}.json").write_text(json.dumps(meta))
                yield f"data: {json.dumps({'event': 'image_ready', 'index': idx, 'image_id': image_id, 'url': f'/api/bucles/image/{image_id}', 'prompt': content_prompt[:120]})}\n\n"
            else:
                yield f"data: {json.dumps({'event': 'image_error', 'index': idx, 'message': err or f'Error generando imagen {idx + 1}'})}\n\n"

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
