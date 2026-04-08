import { useState, useEffect } from "react"

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleString("es", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  })
}

export default function HistoryPanel() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(null)
  const audioRef = useState(null)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/history`)
      const data = await res.json()
      setHistory(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchHistory() }, [])

  const handleDelete = async (filename) => {
    if (!confirm(`¿Eliminar "${filename}"?`)) return
    await fetch(`${import.meta.env.VITE_API_URL}/api/history/${filename}`, { method: "DELETE" })
    fetchHistory()
  }

  if (loading) {
    return (
      <div className="empty-state fade-up">
        <div className="pulse" style={{ fontSize: "2rem", marginBottom: 12 }}>◈</div>
        <div>Cargando historial...</div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="empty-state fade-up">
        <div className="empty-icon">◎</div>
        <div>No hay audios generados aún</div>
        <div className="text-xs text-muted mt-8">
          Los archivos exportados aparecerán aquí
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Historial de Audios</div>
            <div className="card-subtitle" style={{ marginTop: 3 }}>
              {history.length} archivo{history.length !== 1 ? "s" : ""} en /salida
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchHistory}>
            ↺ Actualizar
          </button>
        </div>

        <div className="card-body" style={{ padding: "12px 22px" }}>
          <div className="history-list">
            {history.map((item, i) => (
              <div key={item.filename} className="history-item fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="history-icon">♪</div>
                <div className="history-info">
                  <div className="history-name">{item.name}</div>
                  <div className="history-meta">
                    {item.size_mb} MB · {formatDate(item.created_at)}
                  </div>
                  {playing === item.filename && (
                    <audio
                      autoPlay
                      controls
                      src={`${import.meta.env.VITE_API_URL}${item.download_url}`}
                      style={{ marginTop: 8, width: "100%", height: 32, accentColor: "var(--accent)" }}
                      onEnded={() => setPlaying(null)}
                    />
                  )}
                </div>
                <div className="history-actions">
                  <button
                    className={`btn btn-ghost btn-sm ${playing === item.filename ? "text-accent" : ""}`}
                    onClick={() => setPlaying(playing === item.filename ? null : item.filename)}
                  >
                    {playing === item.filename ? "■ Parar" : "▶ Escuchar"}
                  </button>
                  <a
                    href={`${import.meta.env.VITE_API_URL}${item.download_url}`}
                    download={item.filename}
                    className="btn btn-secondary btn-sm"
                  >
                    ↓
                  </a>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(item.filename)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
