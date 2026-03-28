import { useEffect, useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import logoImg from "../assets/logo.png"
import "./Landing.css"

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
  return scrolled
}

const NAV_LINKS = [
  { to: "/portafolio/nosotros",  label: "Nosotros"  },
  { to: "/portafolio/canal",     label: "Canal"     },
  { to: "/portafolio/contenido", label: "Contenido" },
  { to: "/portafolio/comunidad", label: "Comunidad" },
]

export default function Landing() {
  const location = useLocation()
  const scrolled  = useNavScroll()

  useEffect(() => {
    document.body.classList.add("landing-body")
    return () => document.body.classList.remove("landing-body")
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  return (
    <>
      {/* Background */}
      <div className="lp-bg" aria-hidden>
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        <div className="lp-orb lp-orb-4" />
      </div>
      <div className="lp-grain" aria-hidden />

      {/* Navbar */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`} role="navigation">
        <Link className="lp-nav-brand" to="/portafolio">
          <img src={logoImg} className="lp-nav-logo" alt="Logo" />
          <span className="lp-nav-brand-name">Ingeniería</span>
        </Link>

        <div className="lp-nav-links">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`lp-nav-link${location.pathname === to ? " lp-nav-link--active" : ""}`}
            >{label}</Link>
          ))}
        </div>
        
        <button className="lp-nav-mobile" aria-label="Menú">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      </nav>

      {/* Page content */}
      <Outlet />

      {/* Footer — static, aparece en todas las páginas */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <img src={logoImg} className="lp-footer-logo" alt="Logo" />
              <span className="lp-footer-name">Ingeniería de la Manifestación</span>
            </div>
            <div className="lp-footer-links">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} className="lp-footer-link">{label}</Link>
              ))}
            </div>
            <span className="lp-footer-copy">© {new Date().getFullYear()} Ingeniería de la Manifestación</span>
          </div>
        </div>
      </footer>
    </>
  )
}
