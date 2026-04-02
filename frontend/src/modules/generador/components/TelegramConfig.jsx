import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("studio_token")}`,
})

function TelegramModal({ onClose }) {
  const [token,    setToken]    = useState("")
  const [chatId,   setChatId]   = useState("")
  const [status,   setStatus]   = useState("idle")   // idle | saving | testing | ok | error
  const [msg,      setMsg]      = useState(null)
  const [config,   setConfig]   = useState(null)

  useEffect(() => {
    fetch(`${API}/api/generador/telegram-config`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        setConfig(d)
        if (d.configured) setChatId(d.chat_id || "")
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!token.trim() || !chatId.trim()) return
    setStatus("saving")
    setMsg(null)
    try {
      const res = await fetch(`${API}/api/generador/telegram-config`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: token, chat_id: chatId }),
      })
      if (!res.ok) throw new Error("Error guardando")
      setStatus("ok")
      setMsg("Configuración guardada")
      setConfig({ configured: true, chat_id: chatId })
      setToken("")
    } catch (e) {
      setStatus("error")
      setMsg(e.message)
    }
  }

  const handleTest = async () => {
    setStatus("testing")
    setMsg(null)
    try {
      const res = await fetch(`${API}/api/generador/telegram-config/test`, {
        method: "POST",
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error de conexión")
      setStatus("ok")
      setMsg("✅ Mensaje de prueba enviado correctamente")
    } catch (e) {
      setStatus("error")
      setMsg(e.message)
    }
  }

  return createPortal(
    <div className="gi-overlay">
      <div className="gi-modal">
        <div className="gi-modal-head">
          <h2 className="gi-modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: "middle" }}>
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Configuración de Telegram
          </h2>
          <button className="gi-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="gi-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Estado actual */}
          {config && (
            <div className="gi-tg-row">
              <div className={`gi-tg-dot${config.configured ? "" : " off"}`} />
              {config.configured
                ? <span>Conectado · Chat ID: <code style={{ color: "var(--gold4)", fontSize: "0.8rem" }}>{config.chat_id}</code></span>
                : <span>Sin configurar</span>
              }
            </div>
          )}

          <div className="gi-field">
            <label className="gi-label">Token del Bot</label>
            <div className="gi-input-wrap">
              <input
                className="gi-input"
                type="password"
                placeholder={config?.configured ? "••• (deja vacío para mantener el actual)" : "123456789:ABCDEF..."}
                value={token}
                onChange={e => setToken(e.target.value)}
              />
            </div>
            <div style={{ fontSize: "0.73rem", color: "var(--tx3)", marginTop: 4 }}>
              Obténlo de @BotFather en Telegram
            </div>
          </div>

          <div className="gi-field">
            <label className="gi-label">Chat ID de destino</label>
            <div className="gi-input-wrap">
              <input
                className="gi-input"
                placeholder="ej: -1001234567890 o @mi_canal"
                value={chatId}
                onChange={e => setChatId(e.target.value)}
              />
            </div>
            <div style={{ fontSize: "0.73rem", color: "var(--tx3)", marginTop: 4 }}>
              ID de usuario, grupo o canal (usa @userinfobot para obtenerlo)
            </div>
          </div>

          {msg && (
            <div className={`gi-alert ${status === "error" ? "gi-alert-error" : "gi-alert-success"}`}>
              <span>{status === "error" ? "✕" : "✓"}</span>
              <span>{msg}</span>
            </div>
          )}
        </div>

        <div className="gi-modal-footer">
          {config?.configured && (
            <button
              className="gi-btn gi-btn-ghost gi-btn-sm"
              onClick={handleTest}
              disabled={status === "testing" || status === "saving"}
            >
              {status === "testing" ? <><span className="gi-spinner" style={{ width: 11, height: 11 }} />Probando…</> : "Verificar conexión"}
            </button>
          )}
          <button className="gi-btn gi-btn-ghost" onClick={onClose}>Cerrar</button>
          <button
            className="gi-btn gi-btn-primary"
            onClick={handleSave}
            disabled={(!token.trim() || !chatId.trim()) || status === "saving"}
          >
            {status === "saving" ? <><span className="gi-spinner" />Guardando…</> : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function TelegramConfig() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="gi-btn gi-btn-ghost gi-btn-sm" onClick={() => setOpen(true)} title="Configurar Telegram">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Telegram
      </button>
      {open && <TelegramModal onClose={() => setOpen(false)} />}
    </>
  )
}
