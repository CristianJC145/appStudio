import { useState } from "react"
import { parseScript, sectionEmoji } from "../utils/scriptFormatter"

/* ── Icons ───────────────────────────────────────────────────── */
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

/* Section SVG icons */
const SECTION_ICONS = {
  HOOK: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  "REVELACIÓN": () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    </svg>
  ),
  "PREPARACIÓN": () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81"/>
      <path d="M14.05 6A7 7 0 0 1 18 10.16"/>
    </svg>
  ),
  AFIRMACIONES: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  CIERRE: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
}

function getSectionIcon(name) {
  const key = name?.toUpperCase()
  const Icon = SECTION_ICONS[key]
  if (!Icon) {
    return () => (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      </svg>
    )
  }
  return Icon
}

/* ── Analysis Collapsible ─────────────────────────────────────── */
const ANALYSIS_ROWS = [
  {
    key: "idea_central",
    label: "Idea central",
    icon: () => (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      </svg>
    ),
  },
  {
    key: "promesa_principal",
    label: "Promesa",
    icon: () => (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    key: "tono_emocional",
    label: "Tono emocional",
    icon: () => (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
  },
]

function AnalysisSummary({ analysis }) {
  const [open, setOpen] = useState(false)
  if (!analysis?.idea_central) return null

  return (
    <div className="gi-analysis-box">
      <button
        className="gi-analysis-toggle"
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gold3)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Análisis del video tendencia
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--tx3)" }}>
            — {open ? "ocultar" : "ver detalles"}
          </span>
        </span>
        <span className={`gi-analysis-toggle-icon${open ? " open" : ""}`}>
          <IconChevronDown />
        </span>
      </button>

      {open && (
        <div className="gi-analysis-content">
          {ANALYSIS_ROWS.map(({ key, label, icon: Icon }) =>
            analysis[key] ? (
              <div key={key} className="gi-analysis-row">
                <div className="gi-analysis-icon"><Icon /></div>
                <div className="gi-analysis-val">
                  <strong style={{ color: "var(--tx)", fontWeight: 600 }}>{label}: </strong>
                  {analysis[key]}
                </div>
              </div>
            ) : null
          )}
          {analysis.argumentos_poderosos?.length > 0 && (
            <div className="gi-analysis-row">
              <div className="gi-analysis-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </div>
              <div className="gi-analysis-val">
                <strong style={{ color: "var(--tx)", fontWeight: 600 }}>Argumentos clave: </strong>
                {analysis.argumentos_poderosos.slice(0, 4).join(" · ")}
              </div>
            </div>
          )}
          {analysis.frases_impacto?.length > 0 && (
            <div className="gi-analysis-row">
              <div className="gi-analysis-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", color: "var(--tx)", fontWeight: 600, marginBottom: 6 }}>
                  Frases de impacto:
                </div>
                {analysis.frases_impacto.slice(0, 4).map((f, i) => (
                  <div key={i} style={{ fontSize: "0.79rem", color: "var(--tx2)", fontStyle: "italic", marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid rgba(212,168,67,0.25)" }}>
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

/* ── Main component ──────────────────────────────────────────── */
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
    } catch {
      const ta = document.createElement("textarea")
      ta.value = script
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSendTelegram = () => {
    const titulo = titles[0] || videoInfo?.titulo || "Guión"
    onSendTelegram(titulo, videoInfo?.url || "")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Analysis panel */}
      {videoAnalysis && <AnalysisSummary analysis={videoAnalysis} />}

      {/* Script sections */}
      {sections.length > 0 ? (
        <div className="gi-script-box">
          {sections.map((section, i) => {
            const SectionIcon = getSectionIcon(section.name)
            return (
              <div key={i} className="gi-script-section">
                <div className="gi-script-section-head">
                  <div className="gi-script-section-icon">
                    <SectionIcon />
                  </div>
                  <span className="gi-script-section-label">{section.name}</span>
                </div>
                <div className="gi-script-section-text">{section.text}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="gi-script-box">
          <div className="gi-script-section">
            <pre style={{
              whiteSpace: "pre-wrap",
              fontSize: "0.9rem",
              color: "var(--tx)",
              lineHeight: 1.8,
              margin: 0,
              fontFamily: "var(--ff-body)",
            }}>
              {script}
            </pre>
          </div>
        </div>
      )}

      {/* Suggested titles */}
      {titles.length > 0 && (
        <div className="gi-script-titles">
          <div className="gi-script-titles-head">
            <div className="gi-script-titles-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <span className="gi-script-titles-label">Títulos sugeridos</span>
          </div>
          <ul className="gi-script-titles-list">
            {titles.map((t, i) => (
              <li key={i} className="gi-script-title-item">
                <span className="gi-script-title-num">{i + 1}</span>
                <span className="gi-script-title-text">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action toolbar */}
      <div className="gi-script-toolbar">
        <button className="btn btn-secondary" onClick={handleCopy}>
          {copied ? <><IconCheck />¡Copiado!</> : <><IconCopy />Copiar guión</>}
        </button>

        <button className="btn btn-ghost" onClick={onRegenerate}>
          <IconRefresh /> Regenerar
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleSendTelegram}
          disabled={telegramStatus === "sending"}
        >
          {telegramStatus === "sending"
            ? <><span className="gi-spinner" />Enviando…</>
            : telegramStatus === "sent"
            ? <><IconCheck />¡Enviado a Telegram!</>
            : <><IconSend />Enviar a Telegram</>}
        </button>

        <div className="gi-script-toolbar-sep" />

        <button className="btn btn-ghost btn-sm" onClick={onReset}>
          <IconX /> Nuevo guión
        </button>
      </div>

      {telegramStatus === "error" && telegramError && (
        <div className="gi-alert gi-alert-error">
          <div className="gi-alert-icon"><IconX /></div>
          <span>{telegramError}</span>
        </div>
      )}
    </div>
  )
}
