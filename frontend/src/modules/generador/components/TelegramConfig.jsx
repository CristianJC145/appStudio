import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("studio_token")}`,
})

const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconXCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)

function TelegramModal({ onClose }) {
  const [token,  setToken]  = useState("")
  const [chatId, setChatId] = useState("")
  const [status, setStatus] = useState("idle")
  const [msg,    setMsg]    = useState(null)
  const [config, setConfig] = useState(null)

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
    setStatus("saving"); setMsg(null)
    try {
      const res = await fetch(`${API}/api/generador/telegram-config`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: token, chat_id: chatId }),
      })
      if (!res.ok) throw new Error("Error guardando")
      setStatus("ok")
      setMsg("Configuración guardada correctamente")
      setConfig({ configured: true, chat_id: chatId })
      setToken("")
    } catch (e) {
      setStatus("error"); setMsg(e.message)
    }
  }

  const handleTest = async () => {
    setStatus("testing"); setMsg(null)
    try {
      const res = await fetch(`${API}/api/generador/telegram-config/test`, {
        method: "POST", headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error de conexión")
      setStatus("ok")
      setMsg("Mensaje de prueba enviado correctamente")
    } catch (e) {
      setStatus("error"); setMsg(e.message)
    }
  }

  const isSuccess = status === "ok"
  const isError   = status === "error"

  return createPortal(
    <div className="gi-overlay">
      <div className="gi-modal">
        <div className="gi-modal-head">
          <h2 className="gi-modal-title">
            <span style={{ color: "var(--gold3)", display: "flex" }}><IconSend /></span>
            Configuración de Telegram
          </h2>
          <button className="gi-modal-close" onClick={onClose} aria-label="Cerrar">
            <IconX />
          </button>
        </div>

        <div className="gi-modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Connection status */}
          {config && (
            <div className="gi-tg-status">
              <div className={`gi-tg-dot${config.configured ? "" : " off"}`} />
              {config.configured
                ? <>Conectado · Chat ID: <code style={{ color: "var(--gold4)", fontSize: "0.8rem", fontFamily: "var(--ff-mono)" }}>{config.chat_id}</code></>
                : "Sin configurar"
              }
            </div>
          )}

          <div className="field">
            <label htmlFor="gi-tg-token">Token del Bot</label>
            <input
              id="gi-tg-token"
              type="password"
              placeholder={config?.configured ? "••• (vacío = mantener actual)" : "123456789:ABCDEF..."}
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            <span style={{ fontSize: "0.72rem", color: "var(--tx3)", marginTop: 4, display: "block" }}>
              Obténlo de @BotFather en Telegram
            </span>
          </div>

          <div className="field">
            <label htmlFor="gi-tg-chat">Chat ID de destino</label>
            <input
              id="gi-tg-chat"
              type="text"
              placeholder="ej: -1001234567890 o @mi_canal"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
            />
            <span style={{ fontSize: "0.72rem", color: "var(--tx3)", marginTop: 4, display: "block" }}>
              Usa @userinfobot para obtener tu Chat ID
            </span>
          </div>

          {msg && (
            <div className={`gi-alert ${isError ? "gi-alert-error" : "gi-alert-success"}`}>
              <div className="gi-alert-icon">
                {isError ? <IconXCircle /> : <IconCheck />}
              </div>
              <span>{msg}</span>
            </div>
          )}
        </div>

        <div className="gi-modal-footer">
          {config?.configured && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleTest}
              disabled={status === "testing" || status === "saving"}
            >
              {status === "testing"
                ? <><span className="gi-spinner" style={{ width: 11, height: 11 }} />Probando…</>
                : "Verificar conexión"}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={(!token.trim() || !chatId.trim()) || status === "saving"}
          >
            {status === "saving"
              ? <><span className="gi-spinner" />Guardando…</>
              : "Guardar"}
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
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
        title="Configurar Telegram"
        aria-label="Configurar bot de Telegram"
      >
        <IconSend />
        Telegram
      </button>
      {open && <TelegramModal onClose={() => setOpen(false)} />}
    </>
  )
}
