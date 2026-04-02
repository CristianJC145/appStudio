"""
YouTube Service — busca videos trending del nicho usando YouTube Data API v3.
Fallback manual cuando la API no está configurada.
"""
import os
from typing import Optional

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# Mapeo de regiones legibles a códigos ISO 3166-1
REGION_CODES = {
    "colombia":   "CO",
    "mexico":     "MX",
    "españa":     "ES",
    "argentina":  "AR",
    "chile":      "CL",
    "peru":       "PE",
    "venezuela":  "VE",
    "latam":      "US",   # fallback a US para LATAM general
    "eeuu":       "US",
    "global":     "US",
}


def _get_region_code(region: str) -> str:
    return REGION_CODES.get(region.lower().strip(), "US")


def _duration_label(iso: str) -> str:
    """Convierte duración ISO 8601 a formato legible (ej: PT1H23M45S → 1:23:45)."""
    import re
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return "?"
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    if h:
        return f"{h}:{mi:02d}:{s:02d}"
    return f"{mi}:{s:02d}"


def _duration_minutes(iso: str) -> int:
    """Retorna duración en minutos."""
    import re
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 60 + mi + (1 if s >= 30 else 0)


def search_trending_videos(nicho: str, region: str, max_results: int = 5) -> list[dict]:
    """
    Busca videos del nicho en YouTube.
    Retorna lista de dicts con: id, titulo, canal, vistas, duracion, duracion_minutos,
    thumbnail, url, descripcion.
    Si YOUTUBE_API_KEY no está configurada, lanza ValueError.
    """
    if not YOUTUBE_API_KEY:
        raise ValueError("YOUTUBE_API_KEY no configurada")

    try:
        from googleapiclient.discovery import build
        yt = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
    except ImportError:
        raise ImportError("google-api-python-client no instalado")

    region_code = _get_region_code(region)

    # 1. Buscar videos del nicho publicados en las últimas 72 horas
    from datetime import datetime, timedelta, timezone
    published_after = (datetime.now(timezone.utc) - timedelta(hours=72)).strftime("%Y-%m-%dT%H:%M:%SZ")

    search_resp = yt.search().list(
        part="snippet",
        q=nicho,
        type="video",
        regionCode=region_code,
        relevanceLanguage="es",
        order="viewCount",
        publishedAfter=published_after,
        maxResults=max_results * 3,   # pedir más para filtrar después
        videoDuration="medium",        # medium = 4-20 min; también buscamos long
    ).execute()

    video_ids = [item["id"]["videoId"] for item in search_resp.get("items", [])]
    if not video_ids:
        return []

    # 2. Obtener estadísticas y detalles de los videos
    details_resp = yt.videos().list(
        part="snippet,statistics,contentDetails",
        id=",".join(video_ids),
    ).execute()

    results = []
    for item in details_resp.get("items", []):
        vid_id   = item["id"]
        snippet  = item.get("snippet", {})
        stats    = item.get("statistics", {})
        content  = item.get("contentDetails", {})

        vistas = int(stats.get("viewCount", 0))
        dur_iso = content.get("duration", "")
        dur_min = _duration_minutes(dur_iso)

        thumbnails = snippet.get("thumbnails", {})
        thumb = (
            thumbnails.get("maxres", {}).get("url") or
            thumbnails.get("high", {}).get("url") or
            thumbnails.get("medium", {}).get("url") or
            ""
        )

        results.append({
            "id":               vid_id,
            "titulo":           snippet.get("title", ""),
            "canal":            snippet.get("channelTitle", ""),
            "vistas":           vistas,
            "duracion":         _duration_label(dur_iso),
            "duracion_minutos": dur_min,
            "thumbnail":        thumb,
            "url":              f"https://www.youtube.com/watch?v={vid_id}",
            "descripcion":      snippet.get("description", "")[:500],
        })

    # Ordenar por vistas y tomar los top N
    results.sort(key=lambda x: x["vistas"], reverse=True)
    return results[:max_results]
