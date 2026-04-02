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
import "./generador.module.css"

// ── Pasos del generador ──────────────────────────────────────────
// 1 → buscar tendencias + seleccionar video
// 2 → configurar y generar guión
// 3 → ver guión generado

export default function GeneradorModule() {
  const [activeTab, setActiveTab] = useState("dna")      // 'dna' | 'generador'
  const [genStep, setGenStep]     = useState(1)           // 1 | 2 | 3
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [uploadMode, setUploadMode]       = useState(false) // mostrar uploader aunque ya haya DNA

  const dnaHook = useDna()
  const trendingHook = useTrending()
  const generatorHook = useScriptGenerator()

  // Cargar DNA al montar
  useEffect(() => {
    dnaHook.loadDna()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cambiar a tab generador si DNA está listo
  const handleDnaReady = () => {
    setUploadMode(false)
    setActiveTab("generador")
    setGenStep(1)
  }

  const handleProcessDna = async (filesByZone) => {
    try {
      await dnaHook.processDna(filesByZone)
      handleDnaReady()
    } catch {
      // error manejado en hook
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
    if (!selectedVideo) return
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

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="gi-root">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="gi-header">
        <div className="gi-header-top">
          <div>
            <h1 className="gi-title">Generador de Guiones IA</h1>
            <p className="gi-subtitle">
              Genera guiones con la voz y fórmula de tu canal, basados en tendencias de YouTube
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <TelegramConfig />
            {dnaReady && (
              <div className="gi-tabs">
                <button
                  className={`gi-tab${activeTab === "dna" ? " active" : ""}`}
                  onClick={() => setActiveTab("dna")}
                >
                  🧬 DNA del Canal
                </button>
                <button
                  className={`gi-tab${activeTab === "generador" ? " active" : ""}`}
                  onClick={() => setActiveTab("generador")}
                >
                  ✍ Generador
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading inicial ───────────────────────────────────── */}
      {dnaLoading && (
        <div className="gi-card">
          <div className="gi-loader-box">
            <div className="gi-spinner gi-spinner-lg" />
            <div className="gi-loader-label">Cargando configuración del canal…</div>
          </div>
        </div>
      )}

      {/* ── Error de carga ────────────────────────────────────── */}
      {dnaHook.status === "error" && (
        <div className="gi-card">
          <div className="gi-card-body">
            <div className="gi-alert gi-alert-error">
              <span>✕</span>
              <div>
                {dnaHook.error}
                <button className="gi-btn gi-btn-ghost gi-btn-sm" style={{ marginLeft: 12 }} onClick={dnaHook.loadDna}>
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sin DNA → estado vacío ────────────────────────────── */}
      {!dnaLoading && dnaHook.status === "idle" && !uploadMode && (
        <div className="gi-card">
          <div className="gi-empty">
            <div className="gi-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
            </div>
            <h2 className="gi-empty-title">Configura el DNA de tu canal</h2>
            <p className="gi-empty-desc">
              Sube tus guiones exitosos, historial de títulos y análisis del canal. La IA extraerá
              tu voz, fórmula y patrones únicos para generar guiones indistinguibles de los tuyos.
            </p>
            <button className="gi-btn gi-btn-primary gi-btn-lg" onClick={() => setUploadMode(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Subir archivos del canal
            </button>
          </div>
        </div>
      )}

      {/* ── Uploader ──────────────────────────────────────────── */}
      {(!dnaLoading && (dnaHook.status === "idle" || uploadMode)) && (uploadMode || dnaHook.status === "idle") && (
        <div className="gi-card">
          <div className="gi-card-head">
            <h2 className="gi-card-title">🧬 DNA del Canal</h2>
            {uploadMode && dnaReady && (
              <button className="gi-btn gi-btn-ghost gi-btn-sm" onClick={() => setUploadMode(false)}>
                Cancelar
              </button>
            )}
          </div>
          <div className="gi-card-body">
            {dnaHook.status === "error" && (
              <div className="gi-alert gi-alert-error" style={{ marginBottom: 16 }}>
                <span>✕</span>
                <span>{dnaHook.error}</span>
              </div>
            )}
            <DnaUploader
              onProcess={handleProcessDna}
              processing={dnaProcessing}
            />
          </div>
        </div>
      )}

      {/* ── DNA listo ─────────────────────────────────────────── */}
      {dnaReady && !uploadMode && (
        <>
          {/* Tab DNA */}
          {activeTab === "dna" && (
            <div className="gi-card">
              <div className="gi-card-head">
                <h2 className="gi-card-title">🧬 DNA del Canal</h2>
                <span style={{ fontSize: "0.75rem", color: "var(--green)", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px rgba(45,190,96,0.6)", display: "inline-block" }} />
                  Analizado y listo
                </span>
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

          {/* Tab Generador */}
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

// ── Sección del Generador (pasos 1-3) ────────────────────────────

function StepIndicator({ step }) {
  const steps = [
    { n: 1, label: "Tendencias" },
    { n: 2, label: "Configurar" },
    { n: 3, label: "Guión" },
  ]
  return (
    <div className="gi-steps">
      {steps.map((s, i) => (
        <div
          key={s.n}
          className={`gi-step${step === s.n ? " active" : ""}${step > s.n ? " done" : ""}`}
        >
          <div className="gi-step-num">
            {step > s.n ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : s.n}
          </div>
          <span className="gi-step-label">{s.label}</span>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: step > s.n ? "var(--gold3)" : "var(--bd-dim)", margin: "0 8px", transition: "background 0.18s" }} />}
        </div>
      ))}
    </div>
  )
}

function GeneradorSection({
  genStep, selectedVideo, trendingHook, generatorHook,
  onSelectVideo, onGenerate, onBack, onRegenerate, onReset,
}) {
  return (
    <div className="gi-card">
      <div className="gi-card-head">
        <h2 className="gi-card-title">✍ Generador de Guiones</h2>
      </div>
      <div className="gi-card-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <StepIndicator step={genStep} />

        {/* Paso 1: Tendencias */}
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

        {/* Paso 2: Configurar + generar */}
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

        {/* Paso 3: Ver guión */}
        {genStep === 3 && generatorHook.status === "generating" && (
          <ScriptGenerator
            selectedVideo={selectedVideo}
            status="generating"
            progressMsg={generatorHook.progressMsg}
            error={null}
            onGenerate={() => {}}
            onBack={onBack}
          />
        )}

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

        {genStep === 3 && generatorHook.status === "error" && (
          <div className="gi-alert gi-alert-error">
            <span>✕</span>
            <div>
              {generatorHook.error}
              <button className="gi-btn gi-btn-ghost gi-btn-sm" style={{ marginLeft: 12 }} onClick={() => onBack()}>
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
