import { useState, useCallback, useEffect } from "react"
import ScriptStep   from "./components/ScriptStep"
import ImageStep    from "./components/ImageStep"
import LoopStep     from "./components/LoopStep"
import LibraryModal from "./components/LibraryModal"

const API = import.meta.env.VITE_API_URL

const STEPS = [
  { id: "script", label: "Guion" },
  { id: "images", label: "Imágenes" },
  { id: "loop",   label: "Bucle" },
]

const MIN_LIBRARY_IMAGES = 5

const DEFAULT_LOOP_CONFIG = {
  duration_s: 30,
  format:     "mp4",
  quality:    "hd",
  fps:        30,
  motion:     "suave",
}

export default function BuclesModule() {
  const [step, setStep]           = useState("script")
  const [showLibrary, setShowLibrary] = useState(false)

  // Config global (API keys + loop params)
  const [config, setConfig] = useState(() => {
    try {
      const s = sessionStorage.getItem("bucles_config")
      return s ? JSON.parse(s) : { openai_key: "", grok_key: "" }
    } catch { return { openai_key: "", grok_key: "" } }
  })

  // Datos entre pasos
  const [script, setScript]           = useState("")
  const [styleHint, setStyleHint]     = useState("")
  const [selectedLibIds, setSelectedLibIds] = useState([])   // IDs de biblioteca para contexto
  const [nImages, setNImages]         = useState(3)
  const [generatedImages, setGeneratedImages] = useState([]) // [{ id, url, prompt, enhanced }]
  const [selectedImage, setSelectedImage]     = useState(null)
  const [loopConfig, setLoopConfig]   = useState(DEFAULT_LOOP_CONFIG)
  const [loopResult, setLoopResult]   = useState(null)       // { url, job_id }
  const [libCount,   setLibCount]     = useState(null)        // null = cargando, number = total

  // Verificar cantidad de imágenes en biblioteca al montar
  useEffect(() => {
    fetch(`${API}/api/bucles/library/count`)
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setLibCount(d.count))
      .catch(() => setLibCount(0))
  }, [])

  const refreshLibCount = useCallback(() => {
    fetch(`${API}/api/bucles/library/count`)
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setLibCount(d.count))
      .catch(() => {})
  }, [])

  const saveConfig = useCallback((patch) => {
    setConfig(prev => {
      const next = { ...prev, ...patch }
      sessionStorage.setItem("bucles_config", JSON.stringify(next))
      return next
    })
  }, [])

  const canGoImages = script.trim().length >= 50
  const canGoLoop   = selectedImage !== null

  const goTo = (id) => {
    if (id === "images" && !canGoImages) return
    if (id === "loop"   && !canGoLoop)   return
    setStep(id)
  }

  const libReady = libCount !== null && libCount >= MIN_LIBRARY_IMAGES

  // ── Gate: biblioteca insuficiente ──────────────────────────
  if (libCount !== null && !libReady) {
    return (
      <div className="bucles-shell">
        <div className="bucles-lib-gate fade-up">
          <div className="bucles-lib-gate-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <h2 className="bucles-lib-gate-title">Configura la biblioteca de estilos</h2>
          <p className="bucles-lib-gate-desc">
            Antes de generar imágenes, necesitas subir al menos <strong>{MIN_LIBRARY_IMAGES} imágenes de referencia</strong>.
            Estas le enseñan a DALL-E el estilo visual, paleta de colores y composición que deben seguir tus bucles.
          </p>

          {/* Progreso visual */}
          <div className="bucles-lib-gate-progress">
            <div className="bucles-lib-gate-dots">
              {Array.from({ length: MIN_LIBRARY_IMAGES }).map((_, i) => (
                <div
                  key={i}
                  className={`bucles-gate-dot${i < libCount ? " filled" : ""}`}
                />
              ))}
            </div>
            <span className="bucles-lib-gate-count">
              {libCount} de {MIN_LIBRARY_IMAGES} imágenes subidas
            </span>
          </div>

          <div className="bucles-lib-gate-tips">
            <div className="bucles-gate-tip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Usa imágenes de los bucles o fondos que ya usas en tu canal
            </div>
            <div className="bucles-gate-tip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Imágenes de naturaleza, cosmos, mandalas o fondos abstractos funcionan bien
            </div>
            <div className="bucles-gate-tip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Variedad de estilos = más creatividad en las generaciones
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowLibrary(true)}
            style={{ marginTop: 8 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Abrir biblioteca y subir imágenes
          </button>
        </div>

        {showLibrary && (
          <LibraryModal
            api={API}
            selectedIds={selectedLibIds}
            onToggle={id => setSelectedLibIds(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )}
            onClose={() => setShowLibrary(false)}
            onLibraryChange={refreshLibCount}
          />
        )}
      </div>
    )
  }

  return (
    <div className="bucles-shell">

      {/* ── Stepper ─────────────────────────────────────────── */}
      <div className="bucles-stepper">
        {STEPS.map((s, i) => {
          const active  = step === s.id
          const enabled = s.id === "script"
            || (s.id === "images" && canGoImages)
            || (s.id === "loop"   && canGoLoop)
          return (
            <button
              key={s.id}
              className={`bucles-step-btn${active ? " active" : ""}${!enabled ? " disabled" : ""}`}
              onClick={() => goTo(s.id)}
              disabled={!enabled}
              type="button"
            >
              <span className="bucles-step-num">{i + 1}</span>
              <span className="bucles-step-label">{s.label}</span>
            </button>
          )
        })}
        <button
          className="bucles-library-btn"
          onClick={() => setShowLibrary(true)}
          type="button"
          title="Biblioteca de imágenes de referencia"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          Biblioteca
        </button>
      </div>

      {/* ── Contenido por paso ──────────────────────────────── */}
      <div className="bucles-content">
        {step === "script" && (
          <ScriptStep
            script={script}           onScript={setScript}
            styleHint={styleHint}     onStyleHint={setStyleHint}
            nImages={nImages}         onNImages={setNImages}
            selectedLibIds={selectedLibIds}
            config={config}           onConfig={saveConfig}
            onNext={() => goTo("images")}
            canNext={canGoImages}
          />
        )}
        {step === "images" && (
          <ImageStep
            api={API}
            script={script}
            styleHint={styleHint}
            nImages={nImages}
            selectedLibIds={selectedLibIds}
            openaiKey={config.openai_key}
            generatedImages={generatedImages}
            onImagesUpdate={setGeneratedImages}
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
            onNext={() => goTo("loop")}
            canNext={canGoLoop}
          />
        )}
        {step === "loop" && (
          <LoopStep
            api={API}
            selectedImage={selectedImage}
            grokKey={config.grok_key}
            loopConfig={loopConfig}
            onLoopConfig={setLoopConfig}
            loopResult={loopResult}
            onLoopResult={setLoopResult}
          />
        )}
      </div>

      {/* ── Modal biblioteca ────────────────────────────────── */}
      {showLibrary && (
        <LibraryModal
          api={API}
          selectedIds={selectedLibIds}
          onToggle={id => setSelectedLibIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
          )}
          onClose={() => setShowLibrary(false)}
          onLibraryChange={refreshLibCount}
        />
      )}
    </div>
  )
}
