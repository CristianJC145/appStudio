"""
Telegram Service — envía archivos y mensajes al bot de Telegram configurado.
Usa la Telegram Bot API directamente via requests (sin dependencia extra).
Config del bot se guarda como JSON por usuario en data/telegram/
"""
import json
import os
from typing import Optional

import requests

TELEGRAM_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "telegram")


# ── Persistencia de config ──────────────────────────────────────────────────

def _config_path(user_id: int) -> str:
    os.makedirs(TELEGRAM_DIR, exist_ok=True)
    return os.path.join(TELEGRAM_DIR, f"user_{user_id}.json")


def save_telegram_config(user_id: int, bot_token: str, chat_id: str) -> None:
    with open(_config_path(user_id), "w", encoding="utf-8") as f:
        json.dump({"bot_token": bot_token, "chat_id": chat_id}, f)


def load_telegram_config(user_id: int) -> Optional[dict]:
    path = _config_path(user_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# ── API calls ───────────────────────────────────────────────────────────────

def _api_url(token: str, method: str) -> str:
    return f"https://api.telegram.org/bot{token}/{method}"


def send_test_message(bot_token: str, chat_id: str) -> dict:
    """Envía un mensaje de prueba. Retorna {'ok': bool, 'error': str}."""
    try:
        resp = requests.post(
            _api_url(bot_token, "sendMessage"),
            json={"chat_id": chat_id, "text": "✅ Conexión verificada desde Studio AI. El bot está funcionando correctamente."},
            timeout=10,
        )
        data = resp.json()
        if data.get("ok"):
            return {"ok": True}
        return {"ok": False, "error": data.get("description", "Error desconocido")}
    except requests.RequestException as e:
        return {"ok": False, "error": str(e)}


def send_document(bot_token: str, chat_id: str, file_bytes: bytes, filename: str, caption: str = "") -> dict:
    """Envía un archivo al chat. Retorna {'ok': bool, 'error': str}."""
    try:
        resp = requests.post(
            _api_url(bot_token, "sendDocument"),
            data={"chat_id": chat_id, "caption": caption[:1024] if caption else ""},
            files={"document": (filename, file_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            timeout=30,
        )
        data = resp.json()
        if data.get("ok"):
            return {"ok": True}
        return {"ok": False, "error": data.get("description", "Error desconocido")}
    except requests.RequestException as e:
        return {"ok": False, "error": str(e)}
