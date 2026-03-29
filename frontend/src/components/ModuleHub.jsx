import { useNavigate } from "react-router-dom"
import modules from "../modules/registry"

export default function ModuleHub({ moduleStates = {} }) {
  const navigate = useNavigate()

  const isEnabled = (id) => moduleStates[id] !== false

  // Only count truly active (not soon, not admin-disabled)
  const activeCount = modules.filter(m => m.status !== "coming-soon" && isEnabled(m.id)).length
  const totalModules = modules.length

  return (
    <div className="hub fade-up">
      {/* Header */}
      <div className="hub-header">
        <h1 className="hub-title">Dashboard</h1>
        <p className="hub-subtitle">Centro de control — Ingeniería de la Manifestación</p>
      </div>

      {/* Stats */}
      <div className="hub-stats">
        <div className="hub-stat">
          <div className="hub-stat-value">{activeCount}</div>
          <div className="hub-stat-label">Módulos activos</div>
        </div>
        <div className="hub-stat">
          <div className="hub-stat-value">{totalModules}</div>
          <div className="hub-stat-label">Módulos totales</div>
        </div>
        <div className="hub-stat">
          <div className="hub-stat-value" style={{ fontSize: "1rem", color: "var(--green)" }}>En línea</div>
          <div className="hub-stat-label">Estado del sistema</div>
        </div>
        <div className="hub-stat">
          <div className="hub-stat-value" style={{ fontSize: "1rem" }}>v3.0</div>
          <div className="hub-stat-label">Versión</div>
        </div>
      </div>

      {/* Module grid */}
      <div className="hub-grid">
        {modules.map((mod) => {
          const isSoon     = mod.status === "coming-soon"
          const isDisabled = !isEnabled(mod.id)
          const blocked    = isSoon || isDisabled

          return (
            <div
              key={mod.id}
              className={`hub-card${isSoon ? " hub-card--soon" : ""}${isDisabled ? " hub-card--disabled" : ""}`}
              onClick={() => !blocked && navigate(mod.path)}
              style={{ "--mod-accent": mod.accent }}
            >
              <div className="hub-card-top">
                <div className="hub-card-icon" style={{ color: isDisabled ? "var(--tx3)" : mod.accent }}>
                  {isDisabled
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    : mod.icon
                  }
                </div>
                <span className={`hub-card-status${isSoon ? " hub-card-status--soon" : isDisabled ? " hub-card-status--disabled" : " hub-card-status--active"}`}>
                  {isSoon ? "Próximamente" : isDisabled ? "Desactivado" : "Activo"}
                </span>
              </div>

              <div className="hub-card-body">
                <div className="hub-card-name">{mod.name}</div>
                <div className="hub-card-desc">
                  {isDisabled ? "Este módulo ha sido desactivado por el administrador." : mod.description}
                </div>
              </div>

              {!blocked && (
                <div className="hub-card-footer">
                  <span className="hub-card-cta">Abrir módulo →</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
