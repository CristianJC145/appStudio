import { useState, useEffect, useRef, useCallback } from "react"
import "./AdminPanel.css"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("studio_token")}`,
})

/* ── Module metadata ─────────────────────────────────────────── */
const MODULE_META = [
  { id: "guiones",    name: "Automatización de Audios",     icon: "◈", accent: "#c9960f" },
  { id: "miniaturas", name: "Automatización de Miniaturas",  icon: "◉", accent: "#4ab8d4" },
  { id: "bucles",     name: "Bucles de Video",               icon: "⟳", accent: "#2dbe60" },
  { id: "imagenes",   name: "Generación de Imágenes",        icon: "✦", accent: "#9370db" },
]

/* ── Future features (placeholders) ─────────────────────────── */
const FUTURE = [
  { icon: "🔑", title: "API Keys",          desc: "Gestiona y rota claves de ElevenLabs por usuario o global.",  eta: "Q3 2025" },
  { icon: "📢", title: "Anuncios",           desc: "Envía notificaciones y avisos a todos los usuarios.",         eta: "Q3 2025" },
  { icon: "📋", title: "Registro de actividad", desc: "Historial detallado de acciones: generaciones, logins, errores.", eta: "Q4 2025" },
  { icon: "⚙️", title: "Configuración global", desc: "Límites de uso, idioma predeterminado, ajustes de voces.",  eta: "Q4 2025" },
  { icon: "📊", title: "Analíticas",         desc: "Gráficas de uso por módulo, usuario y período de tiempo.",    eta: "Q1 2026" },
  { icon: "💾", title: "Respaldos",          desc: "Exporta y restaura audios, guiones y configuraciones.",       eta: "Q1 2026" },
]

/* ── Icons ───────────────────────────────────────────────────── */
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconModules = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const IconTable = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
  </svg>
)
const IconRocket = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)

/* ── Toggle switch ───────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`ap-toggle${checked ? " on" : ""}${disabled ? " disabled" : ""}`}
    >
      <span className="ap-toggle-thumb" />
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PANEL
══════════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  /* Module states */
  const [moduleStates, setModuleStates] = useState({})
  const [toggling, setToggling]         = useState({})

  /* Active users SSE */
  const [activeUsers, setActiveUsers] = useState(null)
  const [sseStatus, setSseStatus]     = useState("connecting")

  /* User management */
  const [users, setUsers]           = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userActions, setUserActions]   = useState({}) // {id: bool} loading
  const [userError, setUserError]       = useState("")

  /* ── Fetch module states ─────────────────── */
  useEffect(() => {
    fetch(`${API}/api/admin/modules`, { headers: authHeaders() })
      .then(r => r.json()).then(setModuleStates).catch(() => {})
  }, [])

  /* ── SSE active users ────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem("studio_token")
    const es = new EventSource(`${API}/api/admin/active-users/stream?token=${token}`)
    es.onopen    = () => setSseStatus("live")
    es.onmessage = (e) => { setActiveUsers(parseInt(e.data, 10)); setSseStatus("live") }
    es.onerror   = () => { setSseStatus("error"); es.close() }
    return () => es.close()
  }, [])

  /* ── Fetch users ─────────────────────────── */
  const fetchUsers = useCallback(() => {
    setUsersLoading(true); setUserError("")
    fetch(`${API}/api/auth/users`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => { setUsers(data); setUsersLoading(false) })
      .catch(() => { setUserError("No se pudieron cargar los usuarios"); setUsersLoading(false) })
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  /* ── Module toggle ───────────────────────── */
  const handleModuleToggle = async (id, val) => {
    setToggling(t => ({ ...t, [id]: true }))
    try {
      const res = await fetch(`${API}/api/admin/modules/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ enabled: val }),
      })
      if (res.ok) setModuleStates(s => ({ ...s, [id]: val }))
    } finally {
      setToggling(t => ({ ...t, [id]: false }))
    }
  }

  /* ── User: change role ───────────────────── */
  const handleRoleChange = async (userId, newRole) => {
    setUserActions(a => ({ ...a, [userId]: true }))
    try {
      await fetch(`${API}/api/auth/users/${userId}/role`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ role: newRole }),
      })
      setUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole } : x))
    } finally {
      setUserActions(a => ({ ...a, [userId]: false }))
    }
  }

  /* ── User: toggle active ─────────────────── */
  const handleActiveToggle = async (userId, newVal) => {
    setUserActions(a => ({ ...a, [userId]: true }))
    try {
      await fetch(`${API}/api/auth/users/${userId}/active`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ is_active: newVal }),
      })
      setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: newVal } : x))
    } finally {
      setUserActions(a => ({ ...a, [userId]: false }))
    }
  }

  const isEnabled = (id) => moduleStates[id] !== false
  const totalUsers   = users.length
  const activeModules = MODULE_META.filter(m => isEnabled(m.id)).length

  /* ──────────────────────────────────────────
     RENDER
  ────────────────────────────────────────── */
  return (
    <div className="ap-wrap">

      {/* Header */}
      <div className="ap-header">
        <span className="ap-admin-pill">Admin</span>
        <h1 className="ap-title">Panel de administración</h1>
        <p className="ap-subtitle">Gestiona usuarios, módulos y monitorea el sistema en tiempo real</p>
      </div>

      {/* ── Stats bar ─────────────────────────── */}
      <div className="ap-stats-bar">
        <div className="ap-stat">
          <span className="ap-stat-value">{activeUsers ?? "—"}</span>
          <span className="ap-stat-label">
            <span className={`ap-sse-dot ${sseStatus}`} />
            En línea ahora
          </span>
        </div>
        <div className="ap-stat-divider" />
        <div className="ap-stat">
          <span className="ap-stat-value">{totalUsers}</span>
          <span className="ap-stat-label">Usuarios registrados</span>
        </div>
        <div className="ap-stat-divider" />
        <div className="ap-stat">
          <span className="ap-stat-value">{activeModules} <span className="ap-stat-of">/ {MODULE_META.length}</span></span>
          <span className="ap-stat-label">Módulos activos</span>
        </div>
      </div>

      {/* ── Row 1: active users + modules ─────── */}
      <div className="ap-grid-top">

        <section className="ap-card">
          <div className="ap-card-head">
            <span className="ap-card-icon"><IconUsers /></span>
            <h2 className="ap-card-title">Usuarios activos</h2>
            <span className={`ap-sse-dot ${sseStatus}`} title={sseStatus === "live" ? "En vivo" : "Reconectando…"} />
          </div>
          <div className="ap-users-display">
            <span className="ap-users-number">{activeUsers === null ? "—" : activeUsers}</span>
            <span className="ap-users-label">{activeUsers === 1 ? "usuario en línea" : "usuarios en línea"}</span>
          </div>
          <p className="ap-note">Actualización cada 5 s · Umbral: 90 s sin actividad</p>
        </section>

        <section className="ap-card">
          <div className="ap-card-head">
            <span className="ap-card-icon"><IconModules /></span>
            <h2 className="ap-card-title">Módulos</h2>
          </div>
          <ul className="ap-module-list">
            {MODULE_META.map(mod => {
              const enabled = isEnabled(mod.id)
              const loading = !!toggling[mod.id]
              return (
                <li key={mod.id} className={`ap-module-row${!enabled ? " off" : ""}`}>
                  <span className="ap-module-icon" style={{ color: mod.accent }}>{mod.icon}</span>
                  <span className="ap-module-name">{mod.name}</span>
                  <span className={`ap-module-status${enabled ? " on" : ""}`}>
                    {loading ? "…" : enabled ? "Activo" : "Inactivo"}
                  </span>
                  <Toggle checked={enabled} onChange={v => handleModuleToggle(mod.id, v)} disabled={loading} />
                </li>
              )
            })}
          </ul>
          <p className="ap-note" style={{ marginTop: 14 }}>Los módulos desactivados quedan bloqueados para todos los usuarios.</p>
        </section>
      </div>

      {/* ── Row 2: User management table ──────── */}
      <section className="ap-card ap-card--full">
        <div className="ap-card-head">
          <span className="ap-card-icon"><IconTable /></span>
          <h2 className="ap-card-title">Gestión de usuarios</h2>
          <button className="ap-icon-btn" onClick={fetchUsers} title="Actualizar" disabled={usersLoading}>
            <span className={usersLoading ? "ap-spin" : ""}><IconRefresh /></span>
          </button>
        </div>

        {userError && <p className="ap-error">{userError}</p>}

        {!userError && (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="ap-skeleton-row">
                        {Array.from({ length: 7 }).map((_, j) => <td key={j}><span className="ap-skeleton" /></td>)}
                      </tr>
                    ))
                  : users.map(u => (
                      <tr key={u.id} className={!u.is_active ? "ap-row-inactive" : ""}>
                        <td className="ap-td-id">#{u.id}</td>
                        <td className="ap-td-user">
                          <span className="ap-user-dot">{u.username.charAt(0).toUpperCase()}</span>
                          {u.username}
                        </td>
                        <td className="ap-td-email">{u.email}</td>
                        <td>
                          <select
                            className={`ap-role-select ${u.role}`}
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            disabled={!!userActions[u.id]}
                          >
                            <option value="user">Usuario</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <span className={`ap-status-pill ${u.is_active ? "active" : "inactive"}`}>
                            {u.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="ap-td-date">
                          {new Date(u.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          <Toggle
                            checked={!!u.is_active}
                            onChange={v => handleActiveToggle(u.id, v)}
                            disabled={!!userActions[u.id]}
                          />
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Row 3: Future features ────────────── */}
      <section className="ap-card ap-card--full">
        <div className="ap-card-head">
          <span className="ap-card-icon"><IconRocket /></span>
          <h2 className="ap-card-title">Próximas funciones de administración</h2>
        </div>
        <div className="ap-future-grid">
          {FUTURE.map(f => (
            <div key={f.title} className="ap-future-card">
              <span className="ap-future-icon">{f.icon}</span>
              <div className="ap-future-body">
                <span className="ap-future-title">{f.title}</span>
                <span className="ap-future-desc">{f.desc}</span>
              </div>
              <span className="ap-future-eta">{f.eta}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
