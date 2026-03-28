import { useEffect } from "react"

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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/>
    <path fill="#000" d="M9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
  </svg>
)

const IconKnowledge = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
)
const IconEvolution = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
  </svg>
)
const IconCommunity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const VALUES = [
  { icon: <IconKnowledge />, name: "Conocimiento profundo", desc: "Enseñanzas basadas en principios universales y ciencia de la consciencia." },
  { icon: <IconEvolution />, name: "Evolución constante",   desc: "Contenido que acompaña el proceso de crecimiento en cada etapa de la vida." },
  { icon: <IconCommunity />, name: "Comunidad consciente",  desc: "Un espacio de seres creadores que se apoyan mutuamente en su evolución." },
]

export default function Nosotros() {
  useReveal()

  return (
    <>
      {/* Page Hero */}
      <div className="lp-page-hero">
        <div className="lp-wrap">
          <div className="lp-page-hero-eyebrow reveal">Quiénes somos</div>
          <h1 className="lp-page-hero-title reveal reveal-delay-1">
            El equipo<br />detrás de la<br /><em>visión</em>
          </h1>
          <p className="lp-page-hero-sub reveal reveal-delay-2">
            Un canal nacido de la pasión por el despertar consciente, construido
            para conectar marcas auténticas con una audiencia que busca transformación real.
          </p>
          <div className="lp-page-hero-meta reveal reveal-delay-3">
            <span className="lp-page-hero-tag">Fundado 2022</span>
            <span className="lp-page-hero-tag">50K+ Comunidad</span>
            <span className="lp-page-hero-tag">Español Latam &amp; España</span>
          </div>
        </div>
      </div>

      {/* About + Daniel */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <div className="lp-about-inner">
            <div>
              <div className="lp-section-label reveal">Nuestra misión</div>
              <h2 className="lp-about-title reveal reveal-delay-1">
                Creado para<br /><em>transformar vidas</em>
              </h2>

              <p className="lp-about-text reveal reveal-delay-2">
                Este canal nació con el objetivo de <strong>contribuir a aumentar la
                frecuencia y vibración de las personas</strong>, de tal manera que entiendan
                la forma en que pueden manifestar en este plano físico la vida que realmente
                desean vivir.
              </p>
              <p className="lp-about-text reveal reveal-delay-2">
                Nuestra prioridad siempre será brindarte los más valiosos conocimientos
                para que puedas aplicarlos en tu vida diaria. <strong>Todos somos seres
                creadores.</strong>
              </p>

              <div className="lp-values reveal reveal-delay-3">
                {VALUES.map(v => (
                  <div key={v.name} className="lp-value-item">
                    <div className="lp-value-icon">{v.icon}</div>
                    <div>
                      <div className="lp-value-name">{v.name}</div>
                      <div className="lp-value-desc">{v.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daniel card */}
            <div className="lp-daniel-card reveal reveal-delay-2">
              <div className="lp-daniel-avatar">D</div>
              <div className="lp-daniel-name">Daniel</div>
              <div className="lp-daniel-role">Fundador &amp; Creador de contenido</div>
              <p className="lp-daniel-quote">
                "Soy Daniel, creador de esta maravillosa comunidad. Estoy aquí para
                acompañarte en este hermoso proceso de evolución consciente y ayudarte
                a entender que tú tienes el poder de crear la realidad que deseas."
              </p>
              <div className="lp-daniel-divider" />
              <div style={{ marginBottom: 16 }}>
                {[
                  { label: "Especialidad", val: "Ley de Atracción & Manifestación" },
                  { label: "Comunidad",    val: "50,000+ seguidores activos" },
                  { label: "Alcance",      val: "Latinoamérica & España" },
                ].map(item => (
                  <div key={item.label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(212,168,67,0.06)" }}>
                    <span style={{ fontSize:"0.68rem", color:"var(--tx3)" }}>{item.label}</span>
                    <span style={{ fontSize:"0.70rem", color:"var(--tx2)", fontWeight:500 }}>{item.val}</span>
                  </div>
                ))}
              </div>
              <div className="lp-daniel-social">
                <a
                  href="https://youtube.com/@ingenieriadelamanifestacion"
                  target="_blank" rel="noopener noreferrer"
                  className="lp-social-btn"
                >
                  <IconYT /> YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
