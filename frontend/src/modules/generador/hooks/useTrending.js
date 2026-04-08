import { useState, useCallback } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("studio_token")}`,
})

export function useTrending() {
  const [videos, setVideos]         = useState([])
  const [status, setStatus]         = useState("idle")   // idle | loading | ready | error | no-api
  const [error, setError]           = useState(null)
  const [transcripts, setTranscripts] = useState({})     // { [video_id]: { status, data } }

  const fetchTrending = useCallback(async (nicho, region, hours = 72) => {
    if (!nicho.trim()) return
    setStatus("loading")
    setError(null)
    setVideos([])
    try {
      const params = new URLSearchParams({ nicho, region, hours })
      const res = await fetch(`${API}/api/generador/trending?${params}`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error buscando tendencias")
      if (data.api_missing) {
        setStatus("no-api")
        return
      }
      setVideos(data.videos || [])
      setStatus("ready")
    } catch (e) {
      setError(e.message)
      setStatus("error")
    }
  }, [])

  const fetchTranscript = useCallback(async (videoId, durationMinutes, videoInfo) => {
    if (transcripts[videoId]?.status === "ready" || transcripts[videoId]?.status === "loading") return
    setTranscripts(prev => ({ ...prev, [videoId]: { status: "loading", data: null } }))
    try {
      const res = await fetch(`${API}/api/generador/transcript`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: videoId,
          duration_minutes: durationMinutes,
          video_info: videoInfo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error extrayendo transcripción")
      setTranscripts(prev => ({ ...prev, [videoId]: { status: "ready", data } }))
    } catch (e) {
      setTranscripts(prev => ({ ...prev, [videoId]: { status: "error", data: null, error: e.message } }))
    }
  }, [transcripts])

  return { videos, status, error, transcripts, fetchTrending, fetchTranscript }
}
