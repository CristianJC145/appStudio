"""
Transcript Service — extrae el contenido de un video de YouTube.
Método 1: youtube-transcript-api (subtítulos)
Método 2: yt-dlp + Whisper (audio → texto)
Método 3: Metadata enriquecida (fallback final)

Maneja videos largos con chunking + resumen por bloques via Claude.
Cachea resultados por 24 horas.
"""
import json
import os
import time
from typing import Optional

import anthropic

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "video_cache")
CACHE_TTL  = 86400  # 24 horas en segundos


# ── Caché ───────────────────────────────────────────────────────────────────

def _cache_path(video_id: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    return os.path.join(CACHE_DIR, f"video_{video_id}.json")


def _load_cache(video_id: str) -> Optional[dict]:
    path = _cache_path(video_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if time.time() - data.get("cached_at", 0) > CACHE_TTL:
            os.remove(path)
            return None
        return data
    except Exception:
        return None


def _save_cache(video_id: str, data: dict) -> None:
    data["cached_at"] = time.time()
    with open(_cache_path(video_id), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ── Método 1: youtube-transcript-api ───────────────────────────────────────

def _get_transcript_api(video_id: str) -> Optional[str]:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            # Priorizar español, luego cualquier idioma
            try:
                t = transcript_list.find_transcript(["es", "es-419", "es-ES", "es-MX"])
            except Exception:
                t = transcript_list.find_generated_transcript(["es", "es-419"])
        except Exception:
            try:
                t = YouTubeTranscriptApi.get_transcript(video_id)
                return " ".join(seg["text"] for seg in t)
            except Exception:
                return None

        segments = t.fetch()
        return " ".join(seg["text"] for seg in segments)
    except ImportError:
        print("[transcript] youtube-transcript-api no instalado")
        return None
    except Exception as e:
        print(f"[transcript] método 1 falló: {e}")
        return None


# ── Método 2: yt-dlp + Whisper ─────────────────────────────────────────────

def _get_transcript_whisper(video_id: str, duration_minutes: int) -> Optional[str]:
    import tempfile, subprocess, shutil
    try:
        import yt_dlp
        import whisper
    except ImportError:
        print("[transcript] yt-dlp o whisper no instalados")
        return None

    tmpdir = tempfile.mkdtemp()
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        audio_path = os.path.join(tmpdir, "audio.%(ext)s")

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": audio_path,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "96",
            }],
            "quiet": True,
            "no_warnings": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Buscar el archivo de audio descargado
        mp3_path = os.path.join(tmpdir, "audio.mp3")
        if not os.path.exists(mp3_path):
            files = [f for f in os.listdir(tmpdir) if f.startswith("audio")]
            if not files:
                return None
            mp3_path = os.path.join(tmpdir, files[0])

        # Usar Whisper (modelo según duración)
        model_name = "small" if duration_minutes <= 20 else "medium"
        model = whisper.load_model(model_name)
        result = model.transcribe(mp3_path, language="es", verbose=False)
        return result.get("text", "")

    except Exception as e:
        print(f"[transcript] método 2 (whisper) falló: {e}")
        return None
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


# ── Método 3: Metadata ──────────────────────────────────────────────────────

def _get_metadata(video_id: str, video_info: Optional[dict] = None) -> dict:
    """Extrae metadata rica si youtube-data-api está disponible, o construye básica."""
    meta = {
        "method": "metadata",
        "titulo":       video_info.get("titulo", "") if video_info else "",
        "descripcion":  video_info.get("descripcion", "") if video_info else "",
        "canal":        video_info.get("canal", "") if video_info else "",
    }
    # Intentar capítulos via yt-dlp
    try:
        import yt_dlp
        url = f"https://www.youtube.com/watch?v={video_id}"
        with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "skip_download": True}) as ydl:
            info = ydl.extract_info(url, download=False)
            meta["capitulos"] = [
                {"titulo": c.get("title", ""), "inicio": c.get("start_time", 0)}
                for c in (info.get("chapters") or [])
            ]
            meta["tags"] = info.get("tags", [])[:20]
            if not meta["descripcion"]:
                meta["descripcion"] = info.get("description", "")[:1000]
    except Exception:
        meta["capitulos"] = []
        meta["tags"] = []
    return meta


# ── Chunking + Análisis por bloques con Claude ──────────────────────────────

def _count_tokens_approx(text: str) -> int:
    """Aproximación simple: ~1.3 tokens por palabra en español."""
    return int(len(text.split()) * 1.3)


def _chunk_text(text: str, max_tokens: int = 7000) -> list[str]:
    """Divide el texto en chunks respetando oraciones."""
    words = text.split()
    chunks = []
    current = []
    current_tokens = 0

    for word in words:
        tok = int(len(word.split()) * 1.3) + 1
        if current_tokens + tok > max_tokens and current:
            chunks.append(" ".join(current))
            current = [word]
            current_tokens = tok
        else:
            current.append(word)
            current_tokens += tok

    if current:
        chunks.append(" ".join(current))
    return chunks


def _summarize_chunk(chunk: str, chunk_idx: int, total: int, client: anthropic.Anthropic) -> dict:
    prompt = f"""Resume este segmento {chunk_idx+1}/{total} del video en máx. 300 palabras.
Extrae:
- Idea principal del segmento
- Argumentos clave (lista de 3-5 puntos)
- Frases de alto impacto (copia textual, mínimo 3)
- Tono emocional

Responde en JSON:
{{"idea_principal": "", "argumentos": [], "frases_impacto": [], "tono": ""}}

SEGMENTO:
{chunk[:6000]}"""

    resp = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )
    import re
    raw = resp.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except Exception:
        return {"idea_principal": raw[:300], "argumentos": [], "frases_impacto": [], "tono": ""}


def _synthesize_analysis(summaries: list[dict], client: anthropic.Anthropic) -> dict:
    summaries_text = json.dumps(summaries, ensure_ascii=False, indent=2)
    prompt = f"""Basándote en estos resúmenes por segmento del video, extrae el análisis completo.

RESÚMENES:
{summaries_text[:12000]}

Genera el análisis final en JSON:
{{
  "idea_central": "",
  "promesa_principal": "",
  "estructura_narrativa": {{
    "apertura": "",
    "desarrollo": [],
    "cierre": ""
  }},
  "argumentos_poderosos": [],
  "gancho_apertura": "",
  "por_que_funciona_el_gancho": "",
  "tono_emocional": "",
  "frases_impacto": [],
  "arco_emocional": "",
  "num_segmentos": {len(summaries)}
}}"""

    import re
    resp = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = resp.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except Exception:
        return {"idea_central": raw[:500], "argumentos_poderosos": [], "frases_impacto": []}


def _analyze_transcript(transcript: str, duration_minutes: int, api_key: str) -> dict:
    """
    Si la transcripción es larga (>8000 tokens aprox), aplica chunking + resumen.
    Retorna dict con análisis completo.
    """
    client = anthropic.Anthropic(api_key=api_key)
    tokens = _count_tokens_approx(transcript)

    if tokens <= 8000:
        # Transcripción corta: análisis directo
        return _synthesize_analysis([{
            "idea_principal": transcript[:4000],
            "argumentos": [],
            "frases_impacto": [],
            "tono": "",
        }], client)

    # Transcripción larga: chunking
    chunks = _chunk_text(transcript, max_tokens=7000)
    summaries = []
    for i, chunk in enumerate(chunks):
        s = _summarize_chunk(chunk, i, len(chunks), client)
        summaries.append(s)

    return _synthesize_analysis(summaries, client)


# ── Función pública principal ───────────────────────────────────────────────

def get_video_content(video_id: str, duration_minutes: int, api_key: str, video_info: Optional[dict] = None) -> dict:
    """
    Retorna dict con:
      method: 'transcript' | 'whisper' | 'metadata'
      transcript: texto completo (si disponible)
      analysis: dict con análisis procesado por Claude
      duration_minutes: int
    """
    # Revisar caché
    cached = _load_cache(video_id)
    if cached:
        print(f"[transcript] usando caché para {video_id}")
        return cached

    transcript = None
    method = "metadata"

    # Método 1
    print(f"[transcript] intentando youtube-transcript-api para {video_id}")
    transcript = _get_transcript_api(video_id)
    if transcript and len(transcript.strip()) > 200:
        method = "transcript"
        print(f"[transcript] éxito método 1, {len(transcript)} chars")
    else:
        # Método 2 (solo si es razonable: videos hasta 90 min para no saturar el servidor)
        if duration_minutes <= 90:
            print(f"[transcript] intentando whisper para {video_id}")
            transcript = _get_transcript_whisper(video_id, duration_minutes)
            if transcript and len(transcript.strip()) > 200:
                method = "whisper"
                print(f"[transcript] éxito método 2, {len(transcript)} chars")
            else:
                transcript = None

    if not transcript:
        method = "metadata"
        print(f"[transcript] usando metadata para {video_id}")

    # Analizar con Claude
    if transcript:
        analysis = _analyze_transcript(transcript, duration_minutes, api_key)
    else:
        meta = _get_metadata(video_id, video_info)
        # Construir texto de metadata para análisis
        meta_text = f"""Título: {meta.get('titulo','')}
Canal: {meta.get('canal','')}
Descripción: {meta.get('descripcion','')}
Tags: {', '.join(meta.get('tags', []))}
Capítulos: {json.dumps(meta.get('capitulos', []), ensure_ascii=False)}"""
        analysis = _analyze_transcript(meta_text, duration_minutes, api_key)
        analysis["metadata"] = meta

    result = {
        "video_id":         video_id,
        "method":           method,
        "transcript":       transcript or "",
        "analysis":         analysis,
        "duration_minutes": duration_minutes,
    }
    _save_cache(video_id, result)
    return result
