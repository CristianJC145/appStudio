import { useState } from "react"
import { parseScript, sectionEmoji } from "../utils/scriptFormatter"

function AnalysisSummary({ analysis }) {
  const [open, setOpen] = useState(false)
  if (!analysis || !analysis.idea_central) return null

  return (
    <div className="gi-analysis-box">
      <button className="gi-analysis-toggle" onClick={() => setOpen(p => !p)}>
        <span>
          📊 Análisis del video tendencia&nbsp;
          <span style={{ fontSize: "0.72rem", color: "var(--tx3)" }}>— haz clic para {open ? "ocultar" : "ver"}</span>
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="gi-analysis-content">
          {analysis.idea_central && (
            <div className="gi-analysis-row">
              <span className="gi-analysis-emoji">💡</span>
              <span className="gi-analysis-val"><strong>Idea central:</strong> {analysis.idea_central}</span>
            </div>
          )}
          {analysis.promesa_principal && (
            <div className="gi-analysis-row">
              <span className="gi-analysis-emoji">🎯</span>
              <span className="gi-analysis-val"><strong>Promesa:</strong> {analysis.promesa_principal}</span>
            </div>
          )}
          {analysis.tono_emocional && (
            <div className="gi-analysis-row">
              <span className="gi-analysis-emoji">🎭</span>
              <span className="gi-analysis-val"><strong>Tono:</strong> {analysis.tono_emocional}</span>
            </div>
          )}
          {analysis.argumentos_poderosos && analysis.argumentos_poderosos.length > 0 && (
            <div className="gi-analysis-row">
              <span className="gi-analysis-emoji">🧱</span>
              <span className="gi-analysis-val">
                <strong>Argumentos clave:</strong> {analysis.argumentos_poderosos.slice(0, 4).join(" · ")}
              </span>
            </div>
          )}
          {analysis.frases_impacto && analysis.frases_impacto.length > 0 && (
            <div className="gi-analysis-row">
              <span className="gi-analysis-emoji">⚡</span>
              <div>
                <strong style={{ fontSize: "0.82rem", color: "var(--tx2)" }}>Frases de impacto:</strong>
                {analysis.frases_impacto.slice(0, 5).map((f, i) => (
                  <div key={i} style={{ fontSize: "0.8rem", color: "var(--tx3)", fontStyle: "italic", marginTop: 3 }}>
                    "{f}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ScriptViewer({
  script,
  videoInfo,
  videoAnalysis,
  telegramStatus,
  telegramError,
  onSendTelegram,
  onRegenerate,
  onReset,
}) {
  const [copied, setCopied] = useState(false)
  const { sections, titles } = parseScript(script)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
      const ta = document.createElement("textarea")
      ta.value = script
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleSendTelegram = () => {
    const titulo = titles[0] || videoInfo?.titulo || "Guión"
    onSendTelegram(titulo, videoInfo?.url || "")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Análisis del video (colapsable) */}
      {videoAnalysis && <AnalysisSummary analysis={videoAnalysis} />}

      {/* Secciones del guión */}
      {sections.length > 0 ? (
        <div className="gi-script-box">
          {sections.map((section, i) => (
            <div key={i} className="gi-script-section">
              <div className="gi-script-section-label">
                {sectionEmoji(section.name)} {section.name}
              </div>
              <div className="gi-script-section-text">{section.text}</div>
            </div>
          ))}
        </div>
      ) : (
        // Fallback: mostrar el texto crudo si no se pudieron parsear secciones
        <div className="gi-script-box">
          <div className="gi-script-section">
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.88rem", color: "var(--tx)", lineHeight: 1.75, margin: 0, fontFamily: "var(--ff-body)" }}>
              {script}
            </pre>
          </div>
        </div>
      )}

      {/* Títulos sugeridos */}
      {titles.length > 0 && (
        <div className="gi-script-titles">
          <div className="gi-script-titles-label">🏷 Títulos sugeridos</div>
          <ul className="gi-script-titles-list">
            {titles.map((t, i) => (
              <li key={i} className="gi-script-title-item">
                <span className="gi-script-title-num">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toolbar de acciones */}
      <div className="gi-script-toolbar">
        <button className="gi-btn gi-btn-secondary" onClick={handleCopy}>
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              ¡Copiado!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copiar guión
            </>
          )}
        </button>

        <button className="gi-btn gi-btn-ghost" onClick={onRegenerate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Regenerar
        </button>

        <button
          className="gi-btn gi-btn-secondary"
          onClick={handleSendTelegram}
          disabled={telegramStatus === "sending"}
        >
          {telegramStatus === "sending" ? (
            <><span className="gi-spinner" />Enviando…</>
          ) : telegramStatus === "sent" ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              ¡Enviado a Telegram!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Enviar a Telegram
            </>
          )}
        </button>

        <button className="gi-btn gi-btn-ghost" onClick={onReset} style={{ marginLeft: "auto" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Nuevo guión
        </button>
      </div>

      {/* Errores de Telegram */}
      {telegramStatus === "error" && telegramError && (
        <div className="gi-alert gi-alert-error">
          <span>✕</span>
          <span>{telegramError}</span>
        </div>
      )}
    </div>
  )
}
