import { useState } from "react"

const DURATIONS = [
  { value: "5",  label: "5 min" },
  { value: "8",  label: "8 min" },
  { value: "10", label: "10 min" },
  { value: "12", label: "12 min" },
  { value: "15", label: "15 min" },
]

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
      {/* Video seleccionado */}
      {selectedVideo && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--surface-2)", borderRadius: "var(--r)", border: "1px solid var(--bd-soft)" }}>
          {selectedVideo.thumbnail ? (
            <img
              src={selectedVideo.thumbnail}
              alt={selectedVideo.titulo}
              style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 80, height: 45, background: "var(--surface-3)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tx3)", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--tx3)", marginBottom: 3 }}>Video tendencia seleccionado</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--tx)", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedVideo.titulo}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--tx2)", marginTop: 2 }}>{selectedVideo.canal}</div>
          </div>
          <button className="gi-btn gi-btn-ghost gi-btn-sm" onClick={onBack} title="Cambiar video">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Cambiar
          </button>
        </div>
      )}

      {/* Formulario de generación */}
      {status !== "generating" && (
        <GeneratorForm
          selectedVideo={selectedVideo}
          onGenerate={onGenerate}
          error={error}
          status={status}
        />
      )}

      {/* Generando... */}
      {status === "generating" && (
        <div className="gi-loader-box">
          <div className="gi-spinner gi-spinner-lg" />
          <div className="gi-loader-label">{progressMsg}</div>
          <div style={{ fontSize: "0.77rem", color: "var(--tx3)" }}>
            Esto puede tardar 20-40 segundos…
          </div>
        </div>
      )}
    </div>
  )
}

function GeneratorForm({ selectedVideo, onGenerate, error, status }) {
  const [nicho,       setNicho]       = useState("")
  const [region,      setRegion]      = useState("colombia")
  const [duracion,    setDuracion]    = useState("10")
  const [instruccion, setInstruccion] = useState("")

  // Pre-rellenar nicho si hay video manual
  const handleSubmit = () => {
    if (!selectedVideo) return
    onGenerate({ nicho, region, duracion, instruccion, videoInfo: selectedVideo })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="gi-form-grid">
        <div className="gi-field">
          <label className="gi-label">Nicho del canal</label>
          <div className="gi-input-wrap">
            <input
              className="gi-input"
              placeholder="ej: manifestación, ley de atracción"
              value={nicho}
              onChange={e => setNicho(e.target.value)}
            />
          </div>
        </div>

        <div className="gi-field">
          <label className="gi-label">Duración objetivo</label>
          <div className="gi-input-wrap">
            <select
              className="gi-select gi-input"
              value={duracion}
              onChange={e => setDuracion(e.target.value)}
            >
              {DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="gi-field gi-full">
          <label className="gi-label">Instrucción adicional <span style={{ fontWeight: 400, textTransform: "none", color: "var(--tx3)" }}>(opcional)</span></label>
          <div className="gi-input-wrap">
            <input
              className="gi-input"
              placeholder='ej: "enfocado en dinero", "para dormirse", "tono más suave"'
              value={instruccion}
              onChange={e => setInstruccion(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="gi-alert gi-alert-error">
          <span>✕</span>
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="gi-btn gi-btn-primary gi-btn-lg"
          onClick={handleSubmit}
          disabled={!selectedVideo || status === "generating"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Generar Guión
        </button>
      </div>
    </div>
  )
}

