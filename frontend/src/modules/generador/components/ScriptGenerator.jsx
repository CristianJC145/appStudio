import { useState } from "react"

const DURATIONS = [
  { value: "5",  label: "5 minutos" },
  { value: "8",  label: "8 minutos" },
  { value: "10", label: "10 minutos" },
  { value: "12", label: "12 minutos" },
  { value: "15", label: "15 minutos" },
]

const IconPlay = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const IconChevronLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IconTv = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>
  </svg>
)
const IconXCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)

export default function ScriptGenerator({
  selectedVideo,
  status,
  progressMsg,
  error,
  onGenerate,
  onBack,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Selected video preview */}
      {selectedVideo && (
        <div className="gi-selected-video">
          {selectedVideo.thumbnail ? (
            <img
              className="gi-selected-video-thumb"
              src={selectedVideo.thumbnail}
              alt={selectedVideo.titulo}
            />
          ) : (
            <div className="gi-selected-video-placeholder">
              <IconTv />
            </div>
          )}
          <div className="gi-selected-video-info">
            <div className="gi-selected-video-tag">Video tendencia seleccionado</div>
            <div className="gi-selected-video-title">{selectedVideo.titulo}</div>
            <div className="gi-selected-video-sub">{selectedVideo.canal}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            title="Cambiar video"
          >
            <IconChevronLeft /> Cambiar
          </button>
        </div>
      )}

      {/* Form or loader */}
      {status !== "generating" ? (
        <GeneratorForm
          selectedVideo={selectedVideo}
          onGenerate={onGenerate}
          error={error}
          status={status}
        />
      ) : (
        <div className="gi-loader-box">
          <div className="gi-spinner-wrap">
            <div className="gi-spinner-ring" />
            <span className="gi-spinner gi-spinner-lg" />
          </div>
          <div className="gi-loader-label">{progressMsg}</div>
          <div className="gi-loader-sub">Esto puede tardar 20–40 segundos…</div>
        </div>
      )}
    </div>
  )
}

function GeneratorForm({ selectedVideo, onGenerate, error, status }) {
  const [nicho,       setNicho]       = useState("")
  const [duracion,    setDuracion]    = useState("10")
  const [instruccion, setInstruccion] = useState("")

  const handleSubmit = () => {
    if (!selectedVideo) return
    onGenerate({
      nicho,
      region: "latam",
      duracion,
      instruccion,
      videoInfo: selectedVideo,
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="gi-form-grid">
        <div>
          <label htmlFor="gi-gen-nicho">Nicho del canal</label>
          <input
            id="gi-gen-nicho"
            type="text"
            placeholder="ej: manifestación, ley de atracción"
            value={nicho}
            onChange={e => setNicho(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="gi-gen-dur">Duración objetivo</label>
          <select
            id="gi-gen-dur"
            value={duracion}
            onChange={e => setDuracion(e.target.value)}
          >
            {DURATIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="gi-full">
          <label htmlFor="gi-gen-instr">
            Instrucción adicional
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--tx3)", marginLeft: 6 }}>
              (opcional)
            </span>
          </label>
          <input
            id="gi-gen-instr"
            type="text"
            placeholder='ej: "enfocado en dinero", "para dormirse", "tono más suave"'
            value={instruccion}
            onChange={e => setInstruccion(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="gi-alert gi-alert-error">
          <div className="gi-alert-icon"><IconXCircle /></div>
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={!selectedVideo || status === "generating"}
        >
          <IconPlay />
          Generar Guión
        </button>
      </div>
    </div>
  )
}
