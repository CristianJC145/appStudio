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
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const TIERS = [
  {
    id: "mencion",
    tier: "Básico",
    name: "Mención",
    desc: "Presentación verbal de tu marca al comienzo o final del video, con enlace en descripción.",
    features: [
      "Mención en voz del creador (30-60 seg)",
      "Enlace en descripción del video",
      "1 video por campaña",
      "Métricas post-publicación",
    ],
    featured: false,
  },
  {
    id: "integracion",
    tier: "Recomendado",
    name: "Integración",
    desc: "Tu producto o servicio se integra de forma natural en el contenido, con demostración real.",
    features: [
      "Integración en segmento del video (2-5 min)",
      "Demostración o uso real del producto",
      "Pin en comentarios por 30 días",
      "Story de lanzamiento",
      "Métricas detalladas + informe",
    ],
    featured: true,
  },
  {
    id: "patrocinio",
    tier: "Premium",
    name: "Patrocinio",
    desc: "Asociación completa: video dedicado, presencia en todas las plataformas y campaña de 30 días.",
    features: [
      "Video completo dedicado a tu marca",
      "Presencia en miniaturas y título",
      "Campaña en todas las plataformas",
      "Stories durante 30 días",
      "Informe de campaña completo",
      "Derechos de reutilización del contenido",
    ],
    featured: false,
  },
]

export default function Comunidad() {
  return (
    <>
      {/* Page Hero */}
      <div className="lp-page-hero">
        <div className="lp-wrap">
          <div className="lp-page-hero-eyebrow">Colaboraciones &amp; Patrocinios</div>
          <h1 className="lp-page-hero-title">
            Conecta con una<br />audiencia<br /><em>consciente</em>
          </h1>
          <p className="lp-page-hero-sub">
            Trabajamos con marcas que comparten nuestra visión de bienestar y
            crecimiento personal. Si tu producto o servicio puede transformar vidas,
            hablemos.
          </p>
          <div className="lp-page-hero-meta">
            <span className="lp-page-hero-tag">Cupos limitados por mes</span>
            <span className="lp-page-hero-tag">Alineación de valores requerida</span>
          </div>
        </div>
      </div>

      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">

          {/* Tiers */}
          <div className="lp-section-label">Modalidades de colaboración</div>
          <div className="lp-sponsor-grid" style={{ marginTop: 20 }}>
            {TIERS.map(t => (
              <div key={t.id} className={`lp-sponsor-card${t.featured ? " lp-sponsor-card--featured" : ""}`}>
                {t.featured && <span className="lp-sponsor-badge">Popular</span>}
                <span className="lp-sponsor-tier">{t.tier}</span>
                <div className="lp-sponsor-name">{t.name}</div>
                <p className="lp-sponsor-desc">{t.desc}</p>
                <ul className="lp-sponsor-features">
                  {t.features.map(f => (
                    <li key={f}>
                      <IconCheck />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:colaboraciones@ingenieriadelamanifestacion.com"
                  className={t.featured ? "btn-primary" : "btn-outline"}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:"0.76rem" }}
                >
                  Consultar disponibilidad <IconArrow />
                </a>
              </div>
            ))}
          </div>

          {/* Contact block */}
          <div className="lp-contact-block">
            <div className="lp-contact-glow" aria-hidden />
            <div>
              <div className="lp-contact-title">¿Tienes algo en mente?</div>
              <p className="lp-contact-sub">
                Cuéntanos sobre tu marca y encontramos la mejor forma de colaborar.
              </p>
            </div>
            <div className="lp-contact-actions">
              <a
                href="https://youtube.com/@ingenieriadelamanifestacion"
                target="_blank" rel="noopener noreferrer"
                className="btn-yt"
              >
                <IconYT /> Ver el canal
              </a>
              <a
                href="mailto:colaboraciones@ingenieriadelamanifestacion.com"
                className="btn-primary"
              >
                <IconMail /> Escribir ahora
              </a>
            </div>
          </div>

          {/* Trust note */}
          <div style={{ textAlign:"center", marginTop:48 }}>
            <p style={{ fontSize:"0.76rem", color:"var(--tx3)", lineHeight:1.6, maxWidth:500, margin:"0 auto" }}>
              Solo colaboramos con marcas cuya misión esté alineada con el bienestar,
              la consciencia y el crecimiento personal. Nos reservamos el derecho de
              rechazar colaboraciones que no encajen con nuestra comunidad.
            </p>
          </div>

        </div>
      </section>
    </>
  )
}
