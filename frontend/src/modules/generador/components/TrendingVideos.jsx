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

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconAlertTriangle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IconXCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

function SkeletonCard() {
  return (
    <div className="gi-skeleton-card">
      <div className="gi-skeleton gi-skeleton-thumb" />
      <div className="gi-skeleton-body">
        <div className="gi-skeleton gi-skeleton-line" style={{ width: "55%" }} />
        <div className="gi-skeleton gi-skeleton-line" />
        <div className="gi-skeleton gi-skeleton-line" style={{ width: "85%" }} />
        <div className="gi-skeleton gi-skeleton-line" style={{ width: "38%" }} />
      </div>
    </div>
  )
}

export default function TrendingVideos({
  status, videos, error, transcripts,
  onSearch, onSelectVideo, selectedVideo,
  onFetchTranscript,
}) {
  const [nicho,      setNicho]      = useState("")
  const [region,     setRegion]     = useState("colombia")
  const [manualMode, setManualMode] = useState(false)
  const [manualTitle, setManualTitle] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    if (!nicho.trim()) return
    onSearch(nicho, region)
  }

  const handleSelect = (video) => {
    onSelectVideo(video)
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
      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="gi-form-grid">
          <div>
            <label htmlFor="gi-nicho">Nicho o tema del canal</label>
            <input
              id="gi-nicho"
              type="text"
              placeholder="ej: manifestación, ley de atracción, subconsciente"
              value={nicho}
              onChange={e => setNicho(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="gi-region">País / Región</label>
            <select
              id="gi-region"
              value={region}
              onChange={e => setRegion(e.target.value)}
            >
              {REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setManualMode(p => !p)}
          >
            <IconEdit />
            Ingresar tema manualmente
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={status === "loading" || !nicho.trim()}
          >
            {status === "loading"
              ? <><span className="gi-spinner" />Buscando tendencias…</>
              : <><IconSearch />Buscar en YouTube</>}
          </button>
        </div>
      </form>

      {/* Manual mode */}
      {manualMode && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="gi-manual">Título o tema del video</label>
            <input
              id="gi-manual"
              type="text"
              placeholder="ej: Cómo activar tu subconsciente mientras duermes"
              value={manualTitle}
              onChange={e => setManualTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleManualSubmit}
            disabled={!manualTitle.trim()}
            style={{ marginBottom: 0, alignSelf: "flex-end" }}
          >
            <IconArrowRight /> Usar este tema
          </button>
        </div>
      )}

      {/* No API key */}
      {status === "no-api" && (
        <div className="gi-alert gi-alert-warn">
          <div className="gi-alert-icon"><IconAlertTriangle /></div>
          <div>
            YouTube API no configurada en el servidor. Usa el modo manual para ingresar el tema del video directamente.
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && error && (
        <div className="gi-alert gi-alert-error">
          <div className="gi-alert-icon"><IconXCircle /></div>
          <span>{error}</span>
        </div>
      )}

      {/* Skeleton loaders */}
      {status === "loading" && (
        <div className="gi-trending-grid">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Video grid */}
      {status === "ready" && videos.length > 0 && (
        <>
          <div style={{ fontSize: "0.8rem", color: "var(--tx2)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--ff-mono)", color: "var(--gold3)", fontWeight: 700 }}>
              {videos.length}
            </span>
            videos encontrados — selecciona uno para generar tu guión
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

      {/* No results */}
      {status === "ready" && videos.length === 0 && (
        <div className="gi-alert gi-alert-info">
          <div className="gi-alert-icon"><IconInfo /></div>
          <span>No se encontraron videos para ese nicho en las últimas 72h. Prueba con otro término o usa el modo manual.</span>
        </div>
      )}
    </div>
  )
}
