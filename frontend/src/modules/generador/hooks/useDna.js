import { useState, useCallback } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("studio_token")}`,
})

export function useDna() {
  const [dna, setDna]       = useState(null)       // null = no cargado, {} = vacío, {...} = listo
  const [status, setStatus] = useState("idle")      // idle | loading | processing | ready | error
  const [error, setError]   = useState(null)

  const loadDna = useCallback(async () => {
    setStatus("loading")
    setError(null)
    try {
      const res = await fetch(`${API}/api/generador/dna`, { headers: authHeaders() })
      if (!res.ok) throw new Error("Error cargando DNA")
      const data = await res.json()
      setDna(data.dna)
      setStatus(data.dna ? "ready" : "idle")
    } catch (e) {
      setError(e.message)
      setStatus("error")
    }
  }, [])

  const processDna = useCallback(async (filesByZone) => {
    // filesByZone: { exitosos: FileList, titulos: FileList, analisis: FileList, bajo_rendimiento: FileList }
    setStatus("processing")
    setError(null)
    try {
      const form = new FormData()
      for (const [zone, files] of Object.entries(filesByZone)) {
        for (const file of (files || [])) {
          form.append(zone, file)
        }
      }
      const res = await fetch(`${API}/api/generador/dna/process`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error procesando DNA")
      setDna(data.dna)
      setStatus("ready")
      return data.dna
    } catch (e) {
      setError(e.message)
      setStatus("error")
      throw e
    }
  }, [])

  const deleteDna = useCallback(async () => {
    setStatus("loading")
    setError(null)
    try {
      await fetch(`${API}/api/generador/dna`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      setDna(null)
      setStatus("idle")
    } catch (e) {
      setError(e.message)
      setStatus("error")
    }
  }, [])

  return { dna, status, error, loadDna, processDna, deleteDna }
}
