import { useNavigate } from "react-router-dom"
import modules from "../modules/registry"

export default function ModuleHub() {
  const navigate = useNavigate()
  const activeModules = modules.filter(m => m.status === "active").length
  const totalModules  = modules.length

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
          <div className="hub-stat-value">{activeModules}</div>
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
          const isSoon = mod.status === "coming-soon"
          return (
            <div
              key={mod.id}
              className={`hub-card ${isSoon ? "hub-card--soon" : ""}`}
              onClick={() => !isSoon && navigate(mod.path)}
              style={{ "--mod-accent": mod.accent }}
            >
              <div className="hub-card-top">
                <div className="hub-card-icon" style={{ color: mod.accent }}>
                  {mod.icon}
                </div>
                <span className={`hub-card-status ${isSoon ? "hub-card-status--soon" : "hub-card-status--active"}`}>
                  {isSoon ? "Próximamente" : "Activo"}
                </span>
              </div>

              <div className="hub-card-body">
                <div className="hub-card-name">{mod.name}</div>
                <div className="hub-card-desc">{mod.description}</div>
              </div>

              {!isSoon && (
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
