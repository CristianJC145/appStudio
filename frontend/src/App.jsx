import { useState, useEffect, useRef, useCallback } from "react"
import ConfigPanel from "./components/ConfigPanel"
import ScriptEditor from "./components/ScriptEditor"
import GenerationProgress from "./components/GenerationProgress"
import ReviewPanel from "./components/ReviewPanel"
import HistoryPanel from "./components/HistoryPanel"
import "./App.css"
import logoImg from "./assets/logo.png"

const DEFAULT_CONFIG = {
  api_key: "",
  voice_id: "0ZflTCV1dnNGRdqxOiW6",
  model_id: "eleven_multilingual_v2",
  language_code: "es",
  voice_settings: {
    stability: 0.45,
    similarity_boost: 0.95,
    style: 0.01,
    use_speaker_boost: true,
  },
  intro_voice_speed: 1.0,
  intro_tempo_factor: 0.98,
  afirm_voice_speed: 0.94,
  afirm_tempo_factor: 0.95,
  medit_voice_speed: 0.9,
  medit_tempo_factor: 0.9,
  pausa_entre_oraciones: 400,
  pausa_entre_afirmaciones: 10000,
  pausa_intro_a_afirm: 2000,
  pausa_afirm_a_medit: 3000,
  pausa_entre_meditaciones: 5000,
  extend_silence: false,
  factor_coma: 1.0,
  factor_punto: 1.2,
  factor_suspensivos: 1.5,
  silence_thresh_db: -40,
  silence_min_ms: 80,
  max_chars_parrafo: 270,
}

export default function App() {
  const [tab, setTab] = useState("editor")
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("medi_config")
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG
    } catch { return DEFAULT_CONFIG }
  })
  const [guion, setGuion] = useState("")
  const [nombre, setNombre] = useState("meditacion")
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [events, setEvents] = useState([])

  // — Intro review state —
  const [introBloques, setIntroBloques] = useState([])
  const [introAudios, setIntroAudios] = useState({})
  const [introDecisions, setIntroDecisions] = useState({})

  // — Afirm review state —
  const [afirmaciones, setAfirmaciones] = useState([])
  const [afirmAudios, setAfirmAudios] = useState({})
  const [afirmDecisions, setAfirmDecisions] = useState({})

  // — Medit review state —
  const [meditaciones, setMeditaciones] = useState([])
  const [meditAudios, setMeditAudios] = useState({})
  const [meditDecisions, setMeditDecisions] = useState({})

  // — Which section is currently under review —
  const [reviewSection, setReviewSection] = useState(null) // "intro" | "afirm" | "medit" | null

  const [downloadUrl, setDownloadUrl] = useState(null)
  const [durationMins, setDurationMins] = useState(null)
  const [generating, setGenerating] = useState(false)
  const esRef = useRef(null)

  useEffect(() => {
    localStorage.setItem("medi_config", JSON.stringify(config))
  }, [config])

  const addEvent = useCallback((evt) => {
    setEvents(prev => [...prev, { ...evt, ts: Date.now() }])
  }, [])

  const startGeneration = async () => {
    if (!config.api_key) return alert("Ingresa tu API Key de ElevenLabs")
    if (!guion.trim()) return alert("El guion está vacío")

    setGenerating(true)
    setEvents([])
    setIntroBloques([])
    setIntroAudios({})
    setIntroDecisions({})
    setAfirmaciones([])
    setAfirmAudios({})
    setAfirmDecisions({})
    setMeditaciones([])
    setMeditAudios({})
    setMeditDecisions({})
    setReviewSection(null)
    setDownloadUrl(null)
    setDurationMins(null)
    setJobStatus("starting")

    try {
      const res = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guion, config, nombre }),
      })
      const data = await res.json()
      const id = data.job_id
      setJobId(id)
      setTab("progress")

      if (esRef.current) esRef.current.close()
      const es = new EventSource(`http://localhost:8000/api/events/${id}`)
      esRef.current = es

      es.onmessage = (e) => {
        const evt = JSON.parse(e.data)
        addEvent(evt)

        // — Intro events —
        if (evt.type === "intro_start") {
          setIntroBloques(new Array(evt.data.total).fill(""))
        }
        if (evt.type === "intro_ready") {
          setIntroAudios(prev => ({ ...prev, [evt.data.index]: evt.data.audio_url }))
          setIntroBloques(prev => {
            const updated = [...prev]
            updated[evt.data.index] = evt.data.text
            return updated
          })
        }
        if (evt.type === "intro_review_start") {
          setReviewSection("intro")
          setJobStatus("awaiting_review")
          setTab("review")
        }
        if (evt.type === "intro_review_done") {
          setReviewSection(null)
        }

        // — Afirm events —
        if (evt.type === "afirm_start") {
          setAfirmaciones(new Array(evt.data.total).fill(""))
        }
        if (evt.type === "afirm_ready") {
          setAfirmAudios(prev => ({ ...prev, [evt.data.index]: evt.data.audio_url }))
          setAfirmaciones(prev => {
            const updated = [...prev]
            updated[evt.data.index] = evt.data.text
            return updated
          })
        }
        if (evt.type === "afirm_review_start") {
          setReviewSection("afirm")
          setJobStatus("awaiting_review")
          setTab("review")
        }
        if (evt.type === "afirm_review_done") {
          setReviewSection(null)
        }

        // — Medit events —
        if (evt.type === "medit_start") {
          setMeditaciones(new Array(evt.data.total).fill(""))
        }
        if (evt.type === "medit_ready") {
          setMeditAudios(prev => ({ ...prev, [evt.data.index]: evt.data.audio_url }))
          setMeditaciones(prev => {
            const updated = [...prev]
            updated[evt.data.index] = evt.data.text
            return updated
          })
        }
        if (evt.type === "medit_review_start") {
          setReviewSection("medit")
          setJobStatus("awaiting_review")
          setTab("review")
        }
        if (evt.type === "medit_review_done") {
          setReviewSection(null)
        }

        // — Final —
        if (evt.type === "building") {
          setJobStatus("building")
          setTab("progress")
        }
        if (evt.type === "done") {
          setDownloadUrl(`http://localhost:8000${evt.data.download_url}`)
          setDurationMins(evt.data.duration_mins)
          setJobStatus("done")
          setGenerating(false)
          setTab("progress")
          es.close()
        }
        if (evt.type === "error") {
          setJobStatus("error")
          setGenerating(false)
          es.close()
        }
      }
      es.onerror = () => { es.close(); setGenerating(false) }
    } catch (err) {
      alert("Error conectando al backend: " + err.message)
      setGenerating(false)
    }
  }

  // Envía una decisión para cualquier sección
  // newText: texto editado (opcional, sólo cuando se regenera con texto nuevo)
  const submitDecision = async (section, index, decision, newText = null) => {
    if (section === "intro") {
      setIntroDecisions(prev => ({ ...prev, [index]: decision }))
      if (newText && decision === "regenerate") {
        setIntroBloques(prev => {
          const updated = [...prev]
          updated[index] = newText
          return updated
        })
      }
    } else if (section === "afirm") {
      setAfirmDecisions(prev => ({ ...prev, [index]: decision }))
      if (newText && decision === "regenerate") {
        setAfirmaciones(prev => {
          const updated = [...prev]
          updated[index] = newText
          return updated
        })
      }
    } else {
      setMeditDecisions(prev => ({ ...prev, [index]: decision }))
      if (newText && decision === "regenerate") {
        setMeditaciones(prev => {
          const updated = [...prev]
          updated[index] = newText
          return updated
        })
      }
    }
    await fetch("http://localhost:8000/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, section, index, decision, new_text: newText || null }),
    })
  }

  // Finaliza la revisión de la sección activa
  const finalizeSection = async (section) => {
    // Aprobar automáticamente los que quedaron sin decisión
    const items     = section === "intro" ? introBloques : section === "afirm" ? afirmaciones : meditaciones
    const decisions = section === "intro" ? introDecisions : section === "afirm" ? afirmDecisions : meditDecisions
    for (let i = 0; i < items.length; i++) {
      if (!decisions[i]) await submitDecision(section, i, "ok")
    }
    await fetch(`http://localhost:8000/api/finalize/${jobId}/${section}`, {
      method: "POST"
    })
    setJobStatus("running")
    setTab("progress")
  }

  // Badge de revisión pendiente
  const pendingIntro = introBloques.filter((_, i) => !introDecisions[i]).length
  const pendingAfirm = afirmaciones.filter((_, i) => !afirmDecisions[i]).length
  const pendingMedit = meditaciones.filter((_, i) => !meditDecisions[i]).length
  const reviewBadge  = jobStatus === "awaiting_review"
    ? (reviewSection === "intro" ? pendingIntro : reviewSection === "afirm" ? pendingAfirm : pendingMedit) || null
    : null

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <img src={logoImg} alt="" />
          <span>INGENIERÍA DE LA MANIFESTACIÓN</span>
        </div>
        <nav className="app-nav">
          {[
            { id: "editor",   label: "Guion" },
            { id: "progress", label: "Progreso", badge: generating ? "●" : null },
            { id: "review",   label: "Revisión", badge: reviewBadge },
            { id: "history",  label: "Historial" },
          ].map(({ id, label, badge }) => (
            <button
              key={id}
              className={`nav-btn ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
              {badge && <span className="nav-badge">{badge}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === "editor" && (
          <div className="editor-layout">
            <ScriptEditor
              guion={guion}
              setGuion={setGuion}
              nombre={nombre}
              setNombre={setNombre}
              onGenerate={startGeneration}
              generating={generating}
            />
            <ConfigPanel config={config} setConfig={setConfig} />
          </div>
        )}

        {tab === "progress" && (
          <GenerationProgress
            events={events}
            jobStatus={jobStatus}
            downloadUrl={downloadUrl}
            durationMins={durationMins}
            reviewSection={reviewSection}
            onGoReview={() => setTab("review")}
            pendingReview={reviewSection === "intro" ? pendingIntro : pendingAfirm}
          />
        )}

        {tab === "review" && (
          <ReviewPanel
            reviewSection={reviewSection}
            // Intro
            introBloques={introBloques}
            introAudios={introAudios}
            introDecisions={introDecisions}
            // Afirm
            afirmaciones={afirmaciones}
            afirmAudios={afirmAudios}
            afirmDecisions={afirmDecisions}
            // Medit
            meditaciones={meditaciones}
            meditAudios={meditAudios}
            meditDecisions={meditDecisions}
            // Shared
            onDecision={submitDecision}
            onFinalize={finalizeSection}
            jobStatus={jobStatus}
          />
        )}

        {tab === "history" && <HistoryPanel />}
      </main>
    </div>
  )
}
