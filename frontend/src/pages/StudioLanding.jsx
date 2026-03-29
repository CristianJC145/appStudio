import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import logoImg from "../assets/logo.png"
import modules from "../modules/registry"
import "./StudioLanding.css"

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".sl-reveal")
    const io  = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target) } }),
      { threshold: 0.08 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ── Icons ─────────────────────────────────────────────────────── */
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IconWave = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2 12h2.5M19.5 12H22M6.5 7v10M10 4v16M13.5 7v10M17 4v16"/>
  </svg>
)
const IconImage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="m21 15-5-5L5 21"/>
  </svg>
)
const IconLoop = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)
const IconMonitor = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconCpu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
  </svg>
)

const MODULE_ICONS = { guiones: IconWave, miniaturas: IconMonitor, bucles: IconLoop, imagenes: IconImage }

const WAVE_H = [35,65,48,82,58,40,72,55,88,42,68,51,76,44,60,78,38,85,50,62]

const FEATURES = [
  { icon: <IconZap />,     title: "Automatización total",     desc: "De guion a audio listo para publicar en minutos, sin fricción." },
  { icon: <IconCpu />,     title: "IA de vanguardia",         desc: "Integración con ElevenLabs para voces ultra-realistas en español." },
  { icon: <IconLock />,    title: "Control total",            desc: "Revisa, aprueba y ajusta cada bloque antes de generar el audio final." },
]

const STACK = ["ElevenLabs TTS", "FastAPI", "React 19", "pydub + ffmpeg", "Server-Sent Events"]

export default function StudioLanding() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  useReveal()

  useEffect(() => {
    document.body.classList.add("sl-body")
    return () => document.body.classList.remove("sl-body")
  }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <>
      {/* ── Ambient bg ───────────────────────────────────────────── */}
      <div className="sl-bg" aria-hidden>
        <div className="sl-orb sl-orb-1" />
        <div className="sl-orb sl-orb-2" />
        <div className="sl-orb sl-orb-3" />
      </div>
      <div className="sl-grid-overlay" aria-hidden />

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className={`sl-nav${scrolled ? " scrolled" : ""}`}>
        <div className="sl-nav-brand" onClick={() => navigate("/")} style={{ cursor:"pointer" }}>
          <img src={logoImg} className="sl-nav-logo" alt="Logo" />
          <span className="sl-nav-name">Studio</span>
          <span className="sl-nav-version">v3.0</span>
        </div>

        <button className="sl-nav-cta" onClick={() => navigate("/studio")}>
          Abrir Studio <IconArrow />
        </button>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="sl-hero">
        <div className="sl-wrap">
          <div className="sl-hero-inner">

            {/* ── Left: text ── */}
            <div className="sl-hero-text">
              <div className="sl-hero-badge sl-reveal">
                <span className="sl-badge-dot" />
                Herramientas internas · En desarrollo activo
              </div>

              <h1 className="sl-hero-title sl-reveal sl-reveal-d1">
                Agentia<br />
                <span className="sl-hero-title-accent">Studio</span>
              </h1>

              <p className="sl-hero-desc sl-reveal sl-reveal-d2">
                Suite de automatización construida específicamente para
                <strong> Ingeniería de la Manifestación</strong>. Desde guiones
                hasta audio final — flujos de trabajo diseñados para escalar la
                producción sin sacrificar calidad.
              </p>

              <div className="sl-hero-actions sl-reveal sl-reveal-d3">
                <button className="sl-btn-primary" onClick={() => navigate("/studio")}>
                  Entrar al Studio <IconArrow />
                </button>
              </div>

              <div className="sl-stack-row sl-reveal sl-reveal-d4">
                <span className="sl-stack-label">Stack</span>
                {STACK.map(s => <span key={s} className="sl-stack-tag">{s}</span>)}
              </div>
            </div>

            {/* ── Right: App screen mockup ── */}
            <div className="sl-hero-visual sl-reveal sl-reveal-d2">
              <div className="sl-screen-glow" aria-hidden />

              {/* App window */}
              <div className="sl-screen">
                {/* Titlebar */}
                <div className="sl-screen-bar">
                  <span className="sl-term-dot sl-term-red" />
                  <span className="sl-term-dot sl-term-yellow" />
                  <span className="sl-term-dot sl-term-green" />
                  <span className="sl-screen-title">studio — meditacion_abundancia</span>
                  <span className="sl-screen-live">
                    <span className="sl-badge-dot" style={{width:"5px",height:"5px"}} />
                    Generando
                  </span>
                </div>

                {/* App body */}
                <div className="sl-screen-body">
                  {/* Sidebar */}
                  <aside className="sl-screen-sidebar">
                    <div className="sl-screen-logo">S</div>
                    {[
                      { id:"guiones",    Icon: IconWave,    active: true },
                      { id:"miniaturas", Icon: IconMonitor               },
                      { id:"bucles",     Icon: IconLoop                  },
                      { id:"imagenes",   Icon: IconImage                 },
                    ].map(({ id, Icon, active }) => (
                      <div key={id} className={`sl-screen-nav${active ? " active" : ""}`}>
                        <Icon />
                      </div>
                    ))}
                  </aside>

                  {/* Main panel */}
                  <div className="sl-screen-main">
                    <div className="sl-screen-hdr">
                      <div>
                        <div className="sl-screen-hdr-title">Meditación de abundancia</div>
                        <div className="sl-screen-hdr-sub">23 bloques · Valentina · ElevenLabs</div>
                      </div>
                      <div className="sl-screen-hdr-pct">38%</div>
                    </div>

                    <div className="sl-screen-blocks">
                      {/* Done block */}
                      <div className="sl-sblock sl-sblock--done">
                        <span className="sl-sblock-num">01</span>
                        <div className="sl-sblock-info">
                          <span className="sl-sblock-name">Intro</span>
                          <span className="sl-sblock-dur">0:34</span>
                        </div>
                        <div className="sl-sblock-wave">
                          {WAVE_H.map((h, j) => (
                            <div key={j} className="sl-wave-bar" style={{"--h":`${h}%`}} />
                          ))}
                        </div>
                        <span className="sl-sblock-ok"><IconCheck /></span>
                      </div>

                      {/* Active block */}
                      <div className="sl-sblock sl-sblock--active">
                        <span className="sl-sblock-num">07</span>
                        <div className="sl-sblock-info">
                          <span className="sl-sblock-name">Meditación · 7/18</span>
                          <span className="sl-sblock-dur">38%</span>
                        </div>
                        <div className="sl-sblock-bar">
                          <div className="sl-sblock-bar-fill" />
                        </div>
                      </div>

                      {/* Queued */}
                      {["Afirmaciones","Cierre"].map((name, i) => (
                        <div key={name} className="sl-sblock sl-sblock--queued">
                          <span className="sl-sblock-num">{String(8+i).padStart(2,"0")}</span>
                          <div className="sl-sblock-info">
                            <span className="sl-sblock-name">{name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitor stand */}
              <div className="sl-monitor-stand">
                <div className="sl-monitor-neck" />
                <div className="sl-monitor-foot" />
              </div>

              {/* Floating accent badges */}
              <div className="sl-float-card sl-float-top">
                <span className="sl-float-val">23</span>
                <span className="sl-float-lbl">bloques totales</span>
              </div>
              <div className="sl-float-card sl-float-bot">
                <span className="sl-float-icon"><IconCheck /></span>
                <span>Audio final listo · mp3</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <div className="sl-stats-bar">
        <div className="sl-wrap">
          <div className="sl-stats-inner">
            {[
              { val: "1",    lbl: "Módulo activo"        },
              { val: "3",    lbl: "En desarrollo"        },
              { val: "100%", lbl: "Interno & privado"    },
              { val: "∞",    lbl: "Escalabilidad"        },
            ].map((s, i) => (
              <div key={s.lbl} className={`sl-stat sl-reveal sl-reveal-d${i+1}`}>
                <div className="sl-stat-val">{s.val}</div>
                <div className="sl-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODULES ──────────────────────────────────────────────── */}
      <section className="sl-section">
        <div className="sl-wrap">
          <div className="sl-section-label sl-reveal">Módulos</div>
          <h2 className="sl-section-title sl-reveal sl-reveal-d1">
            Suite de<br /><span className="sl-title-accent">automatización</span>
          </h2>
          <p className="sl-section-sub sl-reveal sl-reveal-d2">
            Cada módulo resuelve una parte del flujo de producción de contenido,
            desde el audio hasta los assets visuales.
          </p>

          <div className="sl-modules-grid">
            {modules.map((mod, i) => {
              const Icon = MODULE_ICONS[mod.id] || IconWave
              const isActive = mod.status === "active"
              return (
                <div
                  key={mod.id}
                  className={`sl-module-card sl-reveal sl-reveal-d${(i%3)+1}${isActive ? " sl-module-card--active" : ""}`}
                  onClick={() => isActive && navigate("/studio")}
                  style={{ cursor: isActive ? "pointer" : "default" }}
                >
                  <div className="sl-module-header">
                    <div className="sl-module-icon" style={{ "--accent": mod.accent }}>
                      <Icon />
                    </div>
                    <span className={`sl-module-status${isActive ? " sl-module-status--active" : ""}`}>
                      {isActive ? "Activo" : "Próximamente"}
                    </span>
                  </div>
                  <div className="sl-module-name">{mod.name}</div>
                  <div className="sl-module-desc">{mod.description}</div>
                  {isActive && (
                    <div className="sl-module-cta">
                      Abrir módulo <IconArrow />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="sl-section sl-section--dark">
        <div className="sl-wrap">
          <div className="sl-section-label sl-reveal">Por qué este studio</div>
          <div className="sl-features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`sl-feature sl-reveal sl-reveal-d${i+1}`}>
                <div className="sl-feature-icon">{f.icon}</div>
                <div className="sl-feature-title">{f.title}</div>
                <div className="sl-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ─────────────────────────────────────────────── */}
      <section className="sl-section">
        <div className="sl-wrap">
          <div className="sl-section-label sl-reveal">Flujo de trabajo</div>
          <h2 className="sl-section-title sl-reveal sl-reveal-d1">
            De guión a<br /><span className="sl-title-accent">audio en minutos</span>
          </h2>

          <div className="sl-workflow">
            {[
              { num: "01", title: "Pega tu guión",       desc: "Intro, afirmaciones y meditación en el editor. Ajusta voces, pausas y música de fondo." },
              { num: "02", title: "Genera con IA",        desc: "El sistema divide el texto en bloques óptimos y los envía a ElevenLabs con los parámetros configurados." },
              { num: "03", title: "Revisa y aprueba",     desc: "Escucha cada bloque antes de confirmar. Solicita regeneración si algo no suena bien." },
              { num: "04", title: "Descarga el audio",    desc: "Obtén el archivo final mezclado, listo para subir a YouTube o distribución." },
            ].map((step, i) => (
              <div key={step.num} className={`sl-step sl-reveal sl-reveal-d${(i%2)+1}`}>
                <div className="sl-step-num">{step.num}</div>
                <div className="sl-step-content">
                  <div className="sl-step-title">{step.title}</div>
                  <div className="sl-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="sl-cta-section">
        <div className="sl-wrap">
          <div className="sl-cta-card sl-reveal">
            <div className="sl-cta-glow" aria-hidden />
            <div className="sl-cta-label">Listo para empezar</div>
            <h2 className="sl-cta-title">
              Abre el Studio<br />y empieza a crear
            </h2>
            <button className="sl-btn-primary sl-btn-lg" onClick={() => navigate("/studio")}>
              Entrar al Studio <IconArrow />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="sl-footer">
        <div className="sl-wrap">
          <div className="sl-footer-inner">
            <div className="sl-footer-brand">
              <img src={logoImg} height="22" alt="Logo" style={{ opacity:0.65 }} />
              <span className="sl-footer-name">Studio</span>
              <span className="sl-footer-sep">·</span>
              <span className="sl-footer-sub">Ingeniería de la Manifestación</span>
            </div>
            <div className="sl-footer-links">
              <button className="sl-footer-link" onClick={() => navigate("/portafolio")}>Portafolio</button>
              <button className="sl-footer-link" onClick={() => navigate("/studio")}>Abrir App</button>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
