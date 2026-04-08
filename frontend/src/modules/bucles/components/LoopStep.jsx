import { useState, useEffect, useRef } from "react"

const DURATION_OPTIONS = [
  { value: 15,  label: "15 s",  desc: "Redes sociales" },
  { value: 30,  label: "30 s",  desc: "Corto" },
  { value: 60,  label: "1 min", desc: "Estándar" },
  { value: 120, label: "2 min", desc: "Largo" },
  { value: 300, label: "5 min", desc: "Meditación" },
]

const QUALITY_OPTIONS = [
  { value: "sd",  label: "SD",  desc: "720p · Rápido" },
  { value: "hd",  label: "HD",  desc: "1080p · Recomendado" },
  { value: "4k",  label: "4K",  desc: "2160p · Lento" },
]

const MOTION_OPTIONS = [
  { value: "suave",    label: "Suave",    desc: "Movimiento mínimo y tranquilo" },
  { value: "moderado", label: "Moderado", desc: "Leve zoom y paneo" },
  { value: "dinamico", label: "Dinámico", desc: "Ken Burns pronunciado" },
]

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="bucles-opt-group">
      <div className="bucles-opt-label">{label}</div>
      <div className="bucles-opt-row">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            className={`bucles-opt-btn${value === o.value ? " active" : ""}`}
            onClick={() => onChange(o.value)}
          >
            <span className="bucles-opt-main">{o.label}</span>
            <span className="bucles-opt-desc">{o.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function LoopStep({
  api, selectedImage, grokKey, loopConfig, onLoopConfig, loopResult, onLoopResult,
}) {
  const [status,   setStatus]   = useState("idle")   // idle | generating | done | error
  const [progress, setProgress] = useState(0)
  const [message,  setMessage]  = useState("")
  const [jobId,    setJobId]    = useState(null)
  const pollRef = useRef(null)

  useEffect(() => () => clearInterval(pollRef.current), [])

  const startGeneration = async () => {
    if (!selectedImage) return
    setStatus("generating")
    setProgress(0)
    setMessage("Iniciando generación del bucle...")
    onLoopResult(null)

    try {
      const r = await fetch(`${api}/api/bucles/generate-loop`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          image_id:   selectedImage.id,
          grok_key:   grokKey,
          ...loopConfig,
        }),
      })
      if (!r.ok) throw new Error("Error al iniciar el bucle")
      const { job_id } = await r.json()
      setJobId(job_id)

      // Polling de estado via SSE
      const es = new EventSource(`${api}/api/bucles/loop-status/${job_id}`)
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          setProgress(data.progress || 0)
          if (data.status === "processing") {
            setMessage(`Procesando... ${data.progress || 0}%`)
          } else if (data.status === "done") {
            setStatus("done")
            setMessage("Bucle generado exitosamente")
            onLoopResult({ url: `${api}${data.url}`, job_id })
            es.close()
          } else if (data.status === "error") {
            setStatus("error")
            setMessage(data.error || "Error desconocido")
            es.close()
          }
        } catch {}
      }
      es.onerror = () => {
        setStatus("error")
        setMessage("Error de conexión con el servidor")
        es.close()
      }
    } catch (err) {
      setStatus("error")
      setMessage(err.message || "Error al generar el bucle")
    }
  }

  const downloadLoop = async () => {
    if (!loopResult?.url) return
    const a = document.createElement("a")
    a.href     = loopResult.url
    a.download = `bucle_meditacion.${loopConfig.format}`
    a.click()
  }

  return (
    <div className="bucles-step-panel fade-up">
      <div className="bucles-panel-header">
        <div>
          <h2 className="bucles-panel-title">Configurar y generar bucle</h2>
          <p className="bucles-panel-desc">
            Ajusta los parámetros del bucle de video. Grok analizará la imagen para optimizar el movimiento.
          </p>
        </div>
      </div>

      <div className="bucles-two-col">

        {/* Columna izquierda: preview + resultado */}
        <div className="bucles-col-main">

          {/* Imagen seleccionada */}
          {selectedImage && (
            <div className="bucles-selected-preview">
              <div className="bucles-selected-preview-label">Imagen seleccionada</div>
              <img
                src={selectedImage.url}
                alt="Imagen para el bucle"
                className="bucles-selected-img"
              />
            </div>
          )}

          {/* Player del bucle generado */}
          {loopResult && (
            <div className="bucles-loop-result fade-up">
              <div className="bucles-loop-result-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Bucle generado
              </div>
              <video
                src={loopResult.url}
                controls
                loop
                autoPlay
                muted
                className="bucles-video-player"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={downloadLoop}
                style={{ marginTop: 12 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar bucle
              </button>
            </div>
          )}

          {/* Progreso */}
          {status === "generating" && (
            <div className="bucles-gen-progress fade-up">
              <div className="bucles-progress-label">
                <span className="pulse" style={{ color: "var(--gold3)" }}>◉</span>
                {message}
              </div>
              <div className="bucles-progress-bar-wrap">
                <div
                  className="bucles-progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="bucles-progress-pct">{progress}%</span>
            </div>
          )}

          {status === "error" && (
            <div className="bucles-gen-error fade-up">{message}</div>
          )}
        </div>

        {/* Columna derecha: opciones */}
        <div className="bucles-col-side">
          <OptionGroup
            label="Duración"
            options={DURATION_OPTIONS}
            value={loopConfig.duration_s}
            onChange={v => onLoopConfig({ ...loopConfig, duration_s: v })}
          />
          <OptionGroup
            label="Calidad"
            options={QUALITY_OPTIONS}
            value={loopConfig.quality}
            onChange={v => onLoopConfig({ ...loopConfig, quality: v })}
          />
          <OptionGroup
            label="Movimiento"
            options={MOTION_OPTIONS}
            value={loopConfig.motion}
            onChange={v => onLoopConfig({ ...loopConfig, motion: v })}
          />

          {/* Formato y FPS */}
          <div className="bucles-opt-group">
            <div className="bucles-opt-label">Formato</div>
            <div className="bucles-opt-row">
              {["mp4","webm"].map(f => (
                <button
                  key={f}
                  type="button"
                  className={`bucles-opt-btn${loopConfig.format === f ? " active" : ""}`}
                  onClick={() => onLoopConfig({ ...loopConfig, format: f })}
                >
                  <span className="bucles-opt-main">{f.toUpperCase()}</span>
                  <span className="bucles-opt-desc">{f === "mp4" ? "Universal" : "Web"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bucles-opt-group">
            <div className="bucles-opt-label">FPS</div>
            <div className="bucles-opt-row">
              {[24,30,60].map(f => (
                <button
                  key={f}
                  type="button"
                  className={`bucles-opt-btn${loopConfig.fps === f ? " active" : ""}`}
                  onClick={() => onLoopConfig({ ...loopConfig, fps: f })}
                >
                  <span className="bucles-opt-main">{f}</span>
                  <span className="bucles-opt-desc">{f === 24 ? "Cine" : f === 30 ? "Estándar" : "Fluido"}</span>
                </button>
              ))}
            </div>
          </div>

          {grokKey && (
            <div className="bucles-grok-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              Grok analizará la imagen para elegir el mejor movimiento automáticamente.
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={startGeneration}
            disabled={!selectedImage || status === "generating"}
            style={{ width: "100%", marginTop: 8 }}
          >
            {status === "generating" ? (
              <><span className="pulse">◉</span> Generando...</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                Generar bucle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
