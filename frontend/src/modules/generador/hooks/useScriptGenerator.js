import { useState, useCallback } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("studio_token")}`,
})

const PROGRESS_MESSAGES = [
  "Analizando contenido del video viral…",
  "Fusionando con el ADN del canal…",
  "Aplicando fórmula óptima del canal…",
  "Construyendo el gancho de apertura…",
  "Desarrollando las afirmaciones…",
  "Finalizando el guión…",
]

export function useScriptGenerator() {
  const [script, setScript]         = useState(null)
  const [status, setStatus]         = useState("idle")   // idle | generating | ready | error
  const [error, setError]           = useState(null)
  const [progressMsg, setProgressMsg] = useState("")
  const [videoAnalysis, setVideoAnalysis] = useState(null)
  const [telegramStatus, setTelegramStatus] = useState("idle") // idle | sending | sent | error
  const [telegramError, setTelegramError] = useState(null)

  const generate = useCallback(async ({ nicho, region, duracion, instruccion, videoInfo }) => {
    setStatus("generating")
    setError(null)
    setScript(null)
    setVideoAnalysis(null)

    // Rotar mensajes de progreso
    let msgIdx = 0
    setProgressMsg(PROGRESS_MESSAGES[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % PROGRESS_MESSAGES.length
      setProgressMsg(PROGRESS_MESSAGES[msgIdx])
    }, 2800)

    try {
      const res = await fetch(`${API}/api/generador/generate`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ nicho, region, duracion, instruccion, video_info: videoInfo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error generando guión")
      setScript(data.script)
      setVideoAnalysis(data.video_analysis)
      setStatus("ready")
    } catch (e) {
      setError(e.message)
      setStatus("error")
    } finally {
      clearInterval(interval)
    }
  }, [])

  const sendToTelegram = useCallback(async (titulo, videoUrl) => {
    if (!script) return
    setTelegramStatus("sending")
    setTelegramError(null)
    try {
      const res = await fetch(`${API}/api/generador/send-telegram`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ script, titulo, video_url: videoUrl || "" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error enviando a Telegram")
      setTelegramStatus("sent")
      setTimeout(() => setTelegramStatus("idle"), 4000)
    } catch (e) {
      setTelegramError(e.message)
      setTelegramStatus("error")
    }
  }, [script])

  const reset = useCallback(() => {
    setScript(null)
    setStatus("idle")
    setError(null)
    setProgressMsg("")
    setVideoAnalysis(null)
    setTelegramStatus("idle")
    setTelegramError(null)
  }, [])

  return {
    script, status, error, progressMsg, videoAnalysis,
    telegramStatus, telegramError,
    generate, sendToTelegram, reset,
  }
}
