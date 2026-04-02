import { useState } from "react"
import VideoCard from "./VideoCard"

const REGIONS = [
  { value: "colombia",  label: "Colombia" },
  { value: "mexico",    label: "México" },
  { value: "españa",    label: "España" },
  { value: "argentina", label: "Argentina" },
  { value: "chile",     label: "Chile" },
  { value: "latam",     label: "LATAM (general)" },
  { value: "global",    label: "Global" },
]

function SkeletonCard() {
  return (
    <div className="gi-skeleton-card">
      <div className="gi-skeleton gi-skeleton-thumb" />
      <div className="gi-skeleton-body">
        <div className="gi-skeleton gi-skeleton-line" style={{ width: "60%" }} />
        <div className="gi-skeleton gi-skeleton-line" />
        <div className="gi-skeleton gi-skeleton-line" style={{ width: "80%" }} />
        <div className="gi-skeleton gi-skeleton-line" style={{ width: "40%" }} />
      </div>
    </div>
  )
}

export default function TrendingVideos({
  status, videos, error, transcripts,
  onSearch, onSelectVideo, selectedVideo,
  onFetchTranscript,
}) {
  const [nicho,  setNicho]  = useState("")
  const [region, setRegion] = useState("colombia")
  const [manualMode, setManualMode] = useState(false)
  const [manualTitle, setManualTitle] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    if (!nicho.trim()) return
    onSearch(nicho, region)
  }

  const handleSelect = (video) => {
    onSelectVideo(video)
    // Iniciar extracción de transcripción en background
    const ts = transcripts[video.id]
    if (!ts || ts.status === "error") {
      onFetchTranscript(video.id, video.duracion_minutos || 10, video)
    }
  }

  const handleManualSubmit = () => {
    if (!manualTitle.trim()) return
    const fakeVideo = {
      id:               `manual_${Date.now()}`,
      titulo:           manualTitle,
      canal:            "Manual",
      vistas:           0,
      duracion:         "—",
      duracion_minutos: 10,
      thumbnail:        "",
      url:              "",
      descripcion:      "",
    }
    onSelectVideo(fakeVideo)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="gi-form-grid">
          <div className="gi-field">
            <label className="gi-label">Nicho o tema del canal</label>
            <div className="gi-input-wrap">
              <input
                className="gi-input"
                placeholder="ej: manifestación, ley de atracción, subconsciente"
                value={nicho}
                onChange={e => setNicho(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="gi-field">
            <label className="gi-label">País / Región</label>
            <div className="gi-input-wrap">
              <select
                className="gi-select gi-input"
                value={region}
                onChange={e => setRegion(e.target.value)}
              >
                {REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            className="gi-btn gi-btn-primary"
            disabled={status === "loading" || !nicho.trim()}
          >
            {status === "loading" ? (
              <><span className="gi-spinner" />Buscando tendencias…</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Buscar tendencias
              </>
            )}
          </button>
        </div>
      </form>

      {/* No API key → modo manual */}
      {status === "no-api" && (
        <div className="gi-alert gi-alert-warn">
          <span>⚠️</span>
          <div>
            <div style={{ marginBottom: 8 }}>
              YouTube API no configurada en el servidor. Puedes ingresar el tema del video manualmente.
            </div>
            <button
              className="gi-btn gi-btn-secondary gi-btn-sm"
              onClick={() => setManualMode(true)}
            >
              Ingresar tema manualmente
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="gi-alert gi-alert-error">
          <span>✕</span>
          <div>
            {error}
            <button
              className="gi-btn gi-btn-ghost gi-btn-sm"
              style={{ marginLeft: 12 }}
              onClick={() => setManualMode(true)}
            >
              Usar modo manual
            </button>
          </div>
        </div>
      )}

      {/* Modo manual */}
      {manualMode && (
        <div className="gi-card" style={{ borderColor: "var(--bd-mid)" }}>
          <div className="gi-card-body" style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div className="gi-field" style={{ flex: 1 }}>
              <label className="gi-label">Título o tema del video</label>
              <div className="gi-input-wrap">
                <input
                  className="gi-input"
                  placeholder="ej: Cómo activar tu subconsciente mientras duermes"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
                />
              </div>
            </div>
            <button
              className="gi-btn gi-btn-primary"
              onClick={handleManualSubmit}
              disabled={!manualTitle.trim()}
            >
              Usar este tema
            </button>
          </div>
        </div>
      )}

      {/* Skeletons mientras carga */}
      {status === "loading" && (
        <div className="gi-trending-grid">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Grid de videos */}
      {status === "ready" && videos.length > 0 && (
        <>
          <div style={{ fontSize: "0.8rem", color: "var(--tx2)" }}>
            Top {videos.length} videos trending — selecciona uno para generar tu guión
          </div>
          <div className="gi-trending-grid">
            {videos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                selected={selectedVideo?.id === video.id}
                onClick={() => handleSelect(video)}
                transcriptStatus={transcripts[video.id]?.status}
              />
            ))}
          </div>
        </>
      )}

      {/* Sin resultados */}
      {status === "ready" && videos.length === 0 && (
        <div className="gi-alert gi-alert-info">
          <span>ℹ️</span>
          <span>No se encontraron videos para ese nicho en las últimas 48h. Prueba con otro término.</span>
        </div>
      )}
    </div>
  )
}
