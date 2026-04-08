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

/* SVG icons para categorías */
const IconInfinity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>
    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
  </svg>
)
const IconMeditate = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="5" r="2"/><path d="M12 7v6M8 21c0-4 1.5-7 4-7s4 3 4 7"/>
    <path d="M6 13c1.5-1 3.5-1.5 6-1.5s4.5.5 6 1.5"/>
  </svg>
)
const IconMind = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 2a6 6 0 0 1 6 6c0 2-1 4-3 5v1H9v-1C7 12 6 10 6 8a6 6 0 0 1 6-6z"/>
    <path d="M9 18h6M10 21h4"/>
  </svg>
)
const IconRocket = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M15 12v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
)
const IconGem = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>
  </svg>
)
const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>
)
const IconShort = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 10l3 3 3-3"/>
  </svg>
)
const IconAudio = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
)
const IconLive = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M23 7 16 12 23 17z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    <circle cx="21" cy="5" r="2" fill="currentColor"/>
  </svg>
)

const CATEGORIES = [
  { icon: <IconInfinity />, name: "Ley de Atracción",  desc: "Cómo atraer conscientemente lo que deseas a tu realidad.", tag: "Top content" },
  { icon: <IconMeditate />, name: "Meditación Guiada", desc: "Audios diseñados para elevar la frecuencia vibratoria.",    tag: "Alta retención" },
  { icon: <IconMind />,     name: "Mentalidad",         desc: "Reprogramación de creencias limitantes y patrones.",        tag: "Serie" },
  { icon: <IconRocket />,   name: "Manifestación",      desc: "Técnicas prácticas para materializar tus deseos.",          tag: "Viral" },
  { icon: <IconGem />,      name: "Abundancia",         desc: "La relación entre energía y prosperidad.",                  tag: "Premium" },
  { icon: <IconEye />,      name: "Consciencia",        desc: "El despertar como herramienta de transformación.",          tag: "Filosófico" },
]

const FORMATS = [
  { icon: <IconVideo />,  label: "Videos largos",    detail: "20–60 min · Alta profundidad" },
  { icon: <IconShort />,  label: "YouTube Shorts",   detail: "60 seg · Alto alcance" },
  { icon: <IconAudio />,  label: "Audios guiados",   detail: "Meditaciones & frecuencias" },
  { icon: <IconLive />,   label: "Lives & Webinars", detail: "Interacción en tiempo real" },
]

export default function Contenido() {
  useReveal()

  return (
    <>
      {/* Page Hero */}
      <div className="lp-page-hero">
        <div className="lp-wrap">
          <div className="lp-page-hero-eyebrow reveal">Nuestro contenido</div>
          <h1 className="lp-page-hero-title reveal reveal-delay-1">
            Temas que<br /><em>transforman</em><br />realidades
          </h1>
          <p className="lp-page-hero-sub reveal reveal-delay-2">
            Cada pieza de contenido está diseñada para generar un impacto profundo,
            posicionando naturalmente las marcas que comparten nuestra visión.
          </p>
          <div className="lp-page-hero-meta reveal reveal-delay-3">
            <span className="lp-page-hero-tag">200+ Videos</span>
            <span className="lp-page-hero-tag">6 Pilares temáticos</span>
            <span className="lp-page-hero-tag">4 Formatos</span>
          </div>
        </div>
      </div>

      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">

          {/* Categories */}
          <div className="lp-section-label reveal">Pilares de contenido</div>
          <div className="lp-content-grid reveal reveal-delay-1">
            {CATEGORIES.map(c => (
              <div key={c.name} className="lp-content-card">
                <div className="lp-content-icon">{c.icon}</div>
                <div className="lp-content-name">{c.name}</div>
                <div className="lp-content-desc">{c.desc}</div>
                <span className="lp-content-tag">{c.tag}</span>
              </div>
            ))}
          </div>

          {/* Formats */}
          <div className="lp-divider" />
          <div className="lp-section-label reveal">Formatos de producción</div>
          <div className="lp-formats reveal reveal-delay-1">
            {FORMATS.map(f => (
              <div key={f.label} className="lp-format-pill">
                {f.icon}
                <span>{f.label}</span>
                <span style={{ color:"var(--tx4)", fontSize:"0.66rem", fontWeight:400 }}>· {f.detail}</span>
              </div>
            ))}
          </div>

          {/* Content value prop */}
          <div className="lp-divider" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="reveal reveal-delay-1">
            {[
              {
                title: "Integración orgánica",
                desc:  "Las marcas alineadas con nuestros valores se integran naturalmente en el contenido, generando una percepción auténtica en la audiencia.",
              },
              {
                title: "Audiencia que confía",
                desc:  "Una comunidad que lleva meses o años siguiendo el canal tiene un nivel de confianza muy superior al de cualquier audiencia fría.",
              },
            ].map(c => (
              <div key={c.title} style={{
                background:"rgba(8,6,2,0.70)", border:"1px solid var(--bd-dim)",
                borderRadius:"var(--r-lg)", padding:"28px 24px"
              }}>
                <div style={{ fontFamily:"var(--ff-h)", fontSize:"0.92rem", fontWeight:800, color:"var(--tx)", marginBottom:10, letterSpacing:"-0.01em" }}>{c.title}</div>
                <div style={{ fontSize:"0.78rem", color:"var(--tx3)", lineHeight:1.68 }}>{c.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  )
}
