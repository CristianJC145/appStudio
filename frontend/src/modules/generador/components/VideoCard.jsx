import { formatViews } from "../utils/scriptFormatter"

const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const IconEye = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconCheck = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconSpinner = () => (
  <span className="gi-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
)
const IconTv = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>
  </svg>
)
const IconUser = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

export default function VideoCard({ video, selected, onClick, transcriptStatus }) {
  const isLoadingTranscript = transcriptStatus === "loading"
  const isTranscriptReady  = transcriptStatus === "ready"
  const isTranscriptError  = transcriptStatus === "error"

  return (
    <div
      className={`gi-video-card${selected ? " selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
      aria-pressed={selected}
    >
      {/* Thumbnail */}
      <div className="gi-video-thumb-wrap">
        {video.thumbnail ? (
          <img
            className="gi-video-thumb"
            src={video.thumbnail}
            alt={video.titulo}
            loading="lazy"
          />
        ) : (
          <div className="gi-video-thumb-placeholder">
            <IconTv />
          </div>
        )}

        {/* Duration pill overlay */}
        {video.duracion && video.duracion !== "—" && (
          <div className="gi-video-duration">{video.duracion}</div>
        )}

        {/* Selected badge */}
        {selected && (
          <div className="gi-video-selected-badge">
            <IconCheck /> Seleccionado
          </div>
        )}

        {/* Play overlay on hover */}
        {!selected && (
          <div className="gi-video-play-overlay" aria-hidden="true">
            <div className="gi-video-play-btn">
              <IconPlay />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="gi-video-body">
        <div className="gi-video-canal">
          <IconUser />
          {video.canal}
        </div>
        <div className="gi-video-title">{video.titulo}</div>
        <div className="gi-video-meta">
          <span className="gi-video-meta-item">
            <IconEye />
            {formatViews(video.vistas)}
          </span>
          <span className="gi-video-meta-item">
            <IconClock />
            {video.duracion}
          </span>
        </div>

        {/* Transcript extraction status — shown only when selected */}
        {selected && (
          <div className={`gi-video-transcript-status${isTranscriptReady ? " ready" : ""}`}>
            {isLoadingTranscript && (
              <>
                <IconSpinner />
                Extrayendo contenido del video…
              </>
            )}
            {isTranscriptReady && (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Contenido extraído
              </>
            )}
            {isTranscriptError && (
              <span style={{ color: "var(--tx3)" }}>Usando metadata del video</span>
            )}
            {!transcriptStatus && (
              <span style={{ color: "var(--tx3)" }}>Preparando extracción…</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
