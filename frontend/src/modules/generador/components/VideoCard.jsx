import { formatViews } from "../utils/scriptFormatter"

export default function VideoCard({ video, selected, onClick, transcriptStatus }) {
  const isLoadingTranscript = transcriptStatus === "loading"
  const isTranscriptReady  = transcriptStatus === "ready"

  return (
    <div
      className={`gi-video-card${selected ? " selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
      aria-pressed={selected}
    >
      {selected && <div className="gi-video-selected-badge">✓ Seleccionado</div>}

      {video.thumbnail ? (
        <img
          className="gi-video-thumb"
          src={video.thumbnail}
          alt={video.titulo}
          loading="lazy"
        />
      ) : (
        <div className="gi-video-thumb-placeholder">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      )}

      <div className="gi-video-body">
        <div className="gi-video-canal">{video.canal}</div>
        <div className="gi-video-title">{video.titulo}</div>
        <div className="gi-video-meta">
          <span className="gi-video-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {formatViews(video.vistas)}
          </span>
          <span className="gi-video-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {video.duracion}
          </span>
        </div>

        {selected && (
          <div className={`gi-video-transcript-status${isTranscriptReady ? " ready" : ""}`}>
            {isLoadingTranscript && (
              <>
                <span className="gi-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                Extrayendo contenido del video…
              </>
            )}
            {isTranscriptReady && (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Contenido extraído
              </>
            )}
            {transcriptStatus === "error" && (
              <span style={{ color: "var(--tx3)" }}>Usando metadata del video</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
