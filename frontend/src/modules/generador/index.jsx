import { useState, useEffect } from "react"
import { useDna }             from "./hooks/useDna"
import { useTrending }        from "./hooks/useTrending"
import { useScriptGenerator } from "./hooks/useScriptGenerator"
import DnaUploader    from "./components/DnaUploader"
import DnaSummary     from "./components/DnaSummary"
import TrendingVideos from "./components/TrendingVideos"
import ScriptGenerator from "./components/ScriptGenerator"
import ScriptViewer   from "./components/ScriptViewer"
import TelegramConfig from "./components/TelegramConfig"
import "./generador.css"

/* ── Inline SVG icons ────────────────────────────────────────── */
const IconDna = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/>
    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m2 9 2-2"/><path d="m2 9 2 2"/>
    <path d="m20 15 2-2"/><path d="m20 15 2 2"/>
  </svg>
)
const IconPen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
)
const IconUpload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconXCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)
const IconTable = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
  </svg>
)

/* ── Step indicator ──────────────────────────────────────────── */
const STEPS = [
  { n: 1, label: "Tendencias" },
  { n: 2, label: "Configurar" },
  { n: 3, label: "Guión" },
]

function StepIndicator({ step }) {
  return (
    <div className="gi-steps">
      {STEPS.map((s, i) => (
        <div
          key={s.n}
          className={`gi-step${step === s.n ? " active" : ""}${step > s.n ? " done" : ""}`}
        >
          <div className="gi-step-num">
            {step > s.n ? <IconCheck /> : s.n}
          </div>
          <div className="gi-step-info">
            <span className="gi-step-label">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`gi-step-connector${step > s.n ? " done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Generator section (steps 1-3) ──────────────────────────── */
function GeneradorSection({
  genStep, selectedVideo, trendingHook, generatorHook,
  onSelectVideo, onGenerate, onBack, onRegenerate, onReset,
}) {
  return (
    <div className="gi-card">
      <div className="gi-card-head">
        <h2 className="gi-card-title">
          <div className="gi-card-title-icon"><IconPen /></div>
          Generador de Guiones
        </h2>
      </div>
      <div className="gi-card-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <StepIndicator step={genStep} />

        {/* Paso 1 — Tendencias */}
        {genStep === 1 && (
          <TrendingVideos
            status={trendingHook.status}
            videos={trendingHook.videos}
            error={trendingHook.error}
            transcripts={trendingHook.transcripts}
            onSearch={trendingHook.fetchTrending}
            onSelectVideo={onSelectVideo}
            selectedVideo={selectedVideo}
            onFetchTranscript={trendingHook.fetchTranscript}
          />
        )}

        {/* Paso 2 — Configurar */}
        {genStep === 2 && (
          <ScriptGenerator
            selectedVideo={selectedVideo}
            status={generatorHook.status}
            progressMsg={generatorHook.progressMsg}
            error={generatorHook.error}
            onGenerate={onGenerate}
            onBack={onBack}
          />
        )}

        {/* Paso 3 — Generando */}
        {genStep === 3 && generatorHook.status === "generating" && (
          <div className="gi-loader-box">
            <div className="gi-spinner-wrap">
              <div className="gi-spinner-ring" />
              <span className="gi-spinner gi-spinner-lg" />
            </div>
            <div className="gi-loader-label">{generatorHook.progressMsg}</div>
            <div className="gi-loader-sub">Esto puede tardar 20–40 segundos…</div>
          </div>
        )}

        {/* Paso 3 — Guión listo */}
        {genStep === 3 && generatorHook.status === "ready" && generatorHook.script && (
          <ScriptViewer
            script={generatorHook.script}
            videoInfo={selectedVideo}
            videoAnalysis={generatorHook.videoAnalysis}
            telegramStatus={generatorHook.telegramStatus}
            telegramError={generatorHook.telegramError}
            onSendTelegram={generatorHook.sendToTelegram}
            onRegenerate={onRegenerate}
            onReset={onReset}
          />
        )}

        {/* Paso 3 — Error */}
        {genStep === 3 && generatorHook.status === "error" && (
          <div className="gi-alert gi-alert-error">
            <div className="gi-alert-icon"><IconXCircle /></div>
            <div>
              {generatorHook.error}
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={onBack}>
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main module ─────────────────────────────────────────────── */
export default function GeneradorModule() {
  const [activeTab,     setActiveTab]     = useState("dna")
  const [genStep,       setGenStep]       = useState(1)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [uploadMode,    setUploadMode]    = useState(false)

  const dnaHook       = useDna()
  const trendingHook  = useTrending()
  const generatorHook = useScriptGenerator()

  useEffect(() => {
    dnaHook.loadDna()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleProcessDna = async (filesByZone) => {
    try {
      await dnaHook.processDna(filesByZone)
      setUploadMode(false)
      setActiveTab("generador")
      setGenStep(1)
    } catch {
      /* error manejado en hook */
    }
  }

  const handleDeleteDna = async () => {
    await dnaHook.deleteDna()
    setActiveTab("dna")
    setUploadMode(false)
    setGenStep(1)
    setSelectedVideo(null)
    generatorHook.reset()
  }

  const handleSelectVideo = (video) => {
    setSelectedVideo(video)
    setGenStep(2)
  }

  const handleGenerate = async (params) => {
    setGenStep(3)
    await generatorHook.generate(params)
  }

  const handleRegenerate = () => {
    setGenStep(2)
    generatorHook.reset()
  }

  const handleReset = () => {
    setGenStep(1)
    setSelectedVideo(null)
    generatorHook.reset()
  }

  const dnaReady      = dnaHook.status === "ready" && dnaHook.dna
  const dnaLoading    = dnaHook.status === "loading"
  const dnaProcessing = dnaHook.status === "processing"
  const showUploader  = !dnaLoading && (dnaHook.status === "idle" || uploadMode)

  return (
    <div className="module-page fade-up">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="gi-header">
        <div className="gi-header-top">
          <div>
            <div className="gi-header-eyebrow">
              <div className="gi-header-dot" />
              <span className="gi-header-badge">Studio AI</span>
            </div>
            <h1 className="gi-title">Generador de Guiones</h1>
            <p className="gi-subtitle">
              Genera guiones con la voz y fórmula de tu canal, basados en las tendencias reales de YouTube
            </p>
          </div>
          <div className="gi-header-actions">
            <TelegramConfig />
            {dnaReady && (
              <div className="gi-tabs">
                <button
                  className={`gi-tab${activeTab === "dna" ? " active" : ""}`}
                  onClick={() => setActiveTab("dna")}
                >
                  <IconDna />
                  DNA del Canal
                </button>
                <button
                  className={`gi-tab${activeTab === "generador" ? " active" : ""}`}
                  onClick={() => setActiveTab("generador")}
                >
                  <IconPen />
                  Generador
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading inicial ─────────────────────────────────────── */}
      {dnaLoading && (
        <div className="gi-card">
          <div className="gi-loader-box">
            <div className="gi-spinner-wrap">
              <div className="gi-spinner-ring" />
              <span className="gi-spinner gi-spinner-lg" />
            </div>
            <div className="gi-loader-label">Cargando configuración del canal…</div>
          </div>
        </div>
      )}

      {/* ── Error de carga ──────────────────────────────────────── */}
      {dnaHook.status === "error" && !dnaLoading && !showUploader && (
        <div className="gi-card">
          <div className="gi-card-body">
            <div className="gi-alert gi-alert-error">
              <div className="gi-alert-icon"><IconXCircle /></div>
              <div>
                {dnaHook.error}
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={dnaHook.loadDna}>
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Estado vacío (sin DNA y sin uploader abierto) ──────── */}
      {!dnaLoading && dnaHook.status === "idle" && !uploadMode && (
        <div className="gi-card">
          <div className="gi-empty">
            <div className="gi-empty-icon-wrap">
              <div className="gi-empty-icon">
                <IconTable />
              </div>
            </div>
            <h2 className="gi-empty-title">Configura el DNA de tu canal</h2>
            <p className="gi-empty-desc">
              Sube tus guiones exitosos, historial de títulos y análisis del canal.
              La IA extraerá tu voz, fórmula y patrones únicos para generar guiones que
              suenen exactamente como los tuyos.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setUploadMode(true)}
            >
              <IconUpload style={{ width: 15, height: 15 }} />
              Subir archivos del canal
            </button>
          </div>
        </div>
      )}

      {/* ── Uploader ────────────────────────────────────────────── */}
      {showUploader && (
        <div className="gi-card">
          <div className="gi-card-head">
            <h2 className="gi-card-title">
              <div className="gi-card-title-icon"><IconDna /></div>
              DNA del Canal
            </h2>
            {uploadMode && dnaReady && (
              <button className="btn btn-ghost btn-sm" onClick={() => setUploadMode(false)}>
                Cancelar
              </button>
            )}
          </div>
          <div className="gi-card-body">
            {dnaHook.status === "error" && (
              <div className="gi-alert gi-alert-error" style={{ marginBottom: 18 }}>
                <div className="gi-alert-icon"><IconXCircle /></div>
                <span>{dnaHook.error}</span>
              </div>
            )}
            <DnaUploader onProcess={handleProcessDna} processing={dnaProcessing} />
          </div>
        </div>
      )}

      {/* ── DNA listo ───────────────────────────────────────────── */}
      {dnaReady && !uploadMode && (
        <>
          {/* Tab: DNA */}
          {activeTab === "dna" && (
            <div className="gi-card">
              <div className="gi-card-head">
                <h2 className="gi-card-title">
                  <div className="gi-card-title-icon"><IconDna /></div>
                  DNA del Canal
                </h2>
                <div className="gi-card-status">
                  <div className="gi-card-status-dot" />
                  Analizado
                </div>
              </div>
              <div className="gi-card-body">
                <DnaSummary
                  dna={dnaHook.dna}
                  onUpdate={() => setUploadMode(true)}
                  onDelete={handleDeleteDna}
                />
              </div>
            </div>
          )}

          {/* Tab: Generador */}
          {activeTab === "generador" && (
            <GeneradorSection
              genStep={genStep}
              selectedVideo={selectedVideo}
              trendingHook={trendingHook}
              generatorHook={generatorHook}
              onSelectVideo={handleSelectVideo}
              onGenerate={handleGenerate}
              onBack={() => setGenStep(1)}
              onRegenerate={handleRegenerate}
              onReset={handleReset}
            />
          )}
        </>
      )}
    </div>
  )
}
