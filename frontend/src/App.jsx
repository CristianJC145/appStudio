import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom"
import Landing from "./pages/Landing"
import StudioLanding from "./pages/StudioLanding"
import LandingHome      from "./pages/landing/Home"
import LandingNosotros  from "./pages/landing/Nosotros"
import LandingCanal     from "./pages/landing/Canal"
import LandingContenido from "./pages/landing/Contenido"
import LandingComunidad from "./pages/landing/Comunidad"
import ModuleHub from "./components/ModuleHub"
import GuionesModule from "./modules/guiones"
import modules from "./modules/registry"
import logoImg from "./assets/logo.png"
import "./App.css"

/* ── Inline SVG icons ────────────────────────────────────────── */
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
)
const IconWave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2 12h2.5M19.5 12H22M6.5 7v10M10 4v16M13.5 7v10M17 4v16"/>
  </svg>
)
const IconImage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="m21 15-5-5L5 21"/>
  </svg>
)
const IconLoop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)
const IconMonitor = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
)
const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 12h18M3 6h18M3 18h18"/>
  </svg>
)
const IconCollapse = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M11 19l-7-7 7-7M21 19l-7-7 7-7"/>
  </svg>
)
const IconExpand = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M13 5l7 7-7 7M3 5l7 7-7 7"/>
  </svg>
)

const MODULE_ICONS = {
  guiones:    IconWave,
  miniaturas: IconMonitor,
  bucles:     IconLoop,
  imagenes:   IconImage,
}

/* ── Shell ───────────────────────────────────────────────────── */
function Shell() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.classList.add("dashboard-body")
    return () => document.body.classList.remove("dashboard-body")
  }, [])

  const isHub      = location.pathname === "/studio" || location.pathname === "/studio/"
  const activeMod  = modules.find(m => location.pathname.startsWith(m.path))

  const breadcrumbs = [
    { label: "Dashboard", path: "/studio" },
    ...(activeMod ? [{ label: activeMod.name, path: activeMod.path }] : []),
  ]

  const goTo = (path) => { navigate(path); setMobileOpen(false) }

  return (
    <div className={`dashboard${collapsed ? " sb-collapsed" : ""}${mobileOpen ? " sb-mobile-open" : ""}`}>

      {/* ══ TOPBAR ══════════════════════════════════════ */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="topbar-menu-btn" onClick={() => setMobileOpen(p => !p)} aria-label="Menú">
            <IconMenu />
          </button>
          <nav className="breadcrumb" aria-label="Navegación">
            {breadcrumbs.map((c, i) => (
              <span key={c.path} className="bc-item">
                {i > 0 && <span className="bc-sep"><IconChevron /></span>}
                {i < breadcrumbs.length - 1
                  ? <button className="bc-link" onClick={() => goTo(c.path)}>{c.label}</button>
                  : <span className="bc-current">{c.label}</span>
                }
              </span>
            ))}
          </nav>
        </div>
        <div className="topbar-right">
          <span className="topbar-badge">v3.0</span>
          <div className="topbar-status">
            <span className="topbar-dot" />
            <span className="topbar-status-label">En línea</span>
          </div>
        </div>
      </header>

      {/* ══ SIDEBAR ═════════════════════════════════════ */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sb-brand" onClick={() => goTo("/studio")} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && goTo("/studio")}>
          <img src={logoImg} className="sb-logo" alt="Logo" />
          <div className="sb-brand-text">
            <span className="sb-brand-name">INGENIERIA</span>
            <span className="sb-brand-sub">Studio</span>
          </div>
        </div>

        {/* Nav */}
        <div className="sb-section-label">Navegación</div>
        <nav className="sb-nav">
          <button className={`sb-item${isHub ? " active" : ""}`} onClick={() => goTo("/studio")} title="Dashboard">
            <span className="sb-item-icon"><IconGrid /></span>
            <span className="sb-item-label">Dashboard</span>
          </button>

          <div className="sb-section-label sb-section-label--modules">Módulos</div>

          {modules.map(mod => {
            const Icon    = MODULE_ICONS[mod.id] || IconGrid
            const isActive = location.pathname.startsWith(mod.path)
            const isSoon  = mod.status === "coming-soon"
            return (
              <button
                key={mod.id}
                className={`sb-item${isActive ? " active" : ""}${isSoon ? " sb-item--soon" : ""}`}
                onClick={() => !isSoon && goTo(mod.path)}
                title={isSoon ? `${mod.name} — Próximamente` : mod.name}
                aria-disabled={isSoon}
              >
                <span className="sb-item-icon"><Icon /></span>
                <span className="sb-item-label">{mod.name}</span>
                {isSoon && <span className="sb-soon-badge">Soon</span>}
              </button>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <button className="sb-collapse-btn" onClick={() => setCollapsed(p => !p)} aria-label="Colapsar sidebar">
          {collapsed ? <IconExpand /> : <IconCollapse />}
          <span className="sb-item-label">Colapsar</span>
        </button>

        {/* Footer */}
        <div className="sb-footer">
          <span className="sb-footer-text">Ingeniería de la Manifestación</span>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sb-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ══ CONTENT ═════════════════════════════════════ */}
      <main className="dash-content">
        <Routes>
          <Route index                  element={<ModuleHub />} />
          <Route path="guiones/*"       element={<GuionesModule />} />
        </Routes>
      </main>

    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudioLanding />} />
        <Route path="/portafolio" element={<Landing />}>
          <Route index                    element={<LandingHome />}      />
          <Route path="nosotros"          element={<LandingNosotros />}  />
          <Route path="canal"             element={<LandingCanal />}     />
          <Route path="contenido"         element={<LandingContenido />} />
          <Route path="comunidad"         element={<LandingComunidad />} />
        </Route>
        <Route path="/studio/*" element={<Shell />} />
      </Routes>
    </BrowserRouter>
  )
}

