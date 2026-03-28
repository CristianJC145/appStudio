import { useEffect } from "react"
import { Link } from "react-router-dom"

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal")
    const io  = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target) } }),
      { threshold: 0.10 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

const IconYT = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/>
    <path fill="#000" d="M9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

export default function Home() {
  useReveal()

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="lp-section lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-inner">
            {/* Left — Editorial headline */}
            <div>
              <div className="lp-hero-eyebrow reveal">
                <span className="lp-hero-eyebrow-dot" />
                Canal de YouTube · Espiritualidad &amp; Consciencia
              </div>

              <h1 className="lp-hero-title reveal reveal-delay-1">
                Ingeniería<br />de la
              </h1>
              <span className="lp-hero-title-sub reveal reveal-delay-2">
                Manifestación
              </span>

              <p className="lp-hero-desc reveal reveal-delay-3">
                Un canal dedicado a elevar la frecuencia y vibración de nuestra comunidad,
                conectando marcas con <strong>una audiencia altamente comprometida</strong> con
                su crecimiento personal y espiritual.
              </p>

              <div className="lp-hero-actions reveal reveal-delay-3">
                <a
                  href="https://youtube.com/@ingenieriadelamanifestacion"
                  target="_blank" rel="noopener noreferrer"
                  className="btn-yt"
                >
                  <IconYT /> Ver el canal
                </a>
                <Link to="/comunidad" className="btn-primary">
                  Colaborar <IconArrow />
                </Link>
              </div>

              <div className="lp-hero-sponsor-note reveal reveal-delay-4">
                <span className="lp-hero-sponsor-text">Ideal para:</span>
                <div className="lp-hero-sponsor-tags">
                  {["Wellness","Meditación","Desarrollo Personal","Mindfulness","Coaching"].map(t => (
                    <span key={t} className="lp-hero-sponsor-tag">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Channel card */}
            <div className="lp-hero-card reveal reveal-delay-2">
              <div className="lp-channel-banner">
                <div className="lp-channel-banner-glow" />
                <div className="lp-channel-banner-text">Ingeniería de la Manifestación</div>
              </div>

              <div className="lp-channel-meta">
                <div className="lp-channel-avatar">D</div>
                <div>
                  <div className="lp-channel-info-name">Ingeniería de la Manifestación</div>
                  <div className="lp-channel-info-handle">@ingenieriadelamanifestacion · Creado por Daniel</div>
                </div>
              </div>

              <div className="lp-channel-stats">
                {[
                  { val: "50K+", lbl: "Suscriptores"   },
                  { val: "200+", lbl: "Videos"          },
                  { val: "5M+",  lbl: "Visualizaciones" },
                ].map(s => (
                  <div key={s.lbl} className="lp-cstat">
                    <div className="lp-cstat-val">{s.val}</div>
                    <div className="lp-cstat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────── */}
      <div className="lp-statsbar">
        <div className="lp-wrap">
          <div className="lp-statsbar-inner">
            {[
              { val: "50K+",  lbl: "Suscriptores"          },
              { val: "5M+",   lbl: "Visualizaciones totales"},
              { val: "68%",   lbl: "Retención promedio"     },
              { val: "15+",   lbl: "Países alcanzados"      },
            ].map((s, i) => (
              <div key={s.lbl} className={`lp-stat-item reveal reveal-delay-${i + 1}`}>
                <div className="lp-stat-val">{s.val}</div>
                <div className="lp-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
