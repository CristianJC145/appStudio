import { useState } from "react"
import { createPortal } from "react-dom"

/* ── Icons ───────────────────────────────────────────────────── */
const IconMic = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const IconKey = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-1 1"/><path d="M3.1 17.9a2 2 0 1 0 2.9-2.9L3.1 12l6-6 2.9 2.9A2 2 0 0 0 15 11.9l5.5-5.5a2 2 0 0 0-2.8-2.8L12 9.1"/>
  </svg>
)
const IconLayoutTemplate = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
  </svg>
)
const IconTag = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const IconList = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconSlash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)
const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/* ── Modals ──────────────────────────────────────────────────── */
function ConfirmDeleteModal({ onConfirm, onCancel }) {
  const [input, setInput] = useState("")
  const valid = input.trim().toUpperCase() === "ELIMINAR"
  return createPortal(
    <div className="gi-overlay">
      <div className="gi-modal">
        <div className="gi-modal-head">
          <h2 className="gi-modal-title">
            <span style={{ color: "var(--red)", display: "flex" }}><IconTrash /></span>
            Eliminar DNA del canal
          </h2>
          <button className="gi-modal-close" onClick={onCancel} aria-label="Cerrar">
            <IconX />
          </button>
        </div>
        <div className="gi-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="gi-alert gi-alert-error">
            <div className="gi-alert-icon"><IconX /></div>
            <span>Esta acción eliminará permanentemente el análisis. Tendrás que volver a subir archivos para reconstruirlo.</span>
          </div>
          <div className="field">
            <label>Escribe ELIMINAR para confirmar</label>
            <input
              type="text"
              placeholder="ELIMINAR"
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="gi-modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={!valid}>
            Eliminar definitivamente
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ConfirmUpdateModal({ onConfirm, onCancel }) {
  return createPortal(
    <div className="gi-overlay">
      <div className="gi-modal">
        <div className="gi-modal-head">
          <h2 className="gi-modal-title">
            <span style={{ color: "var(--gold3)", display: "flex" }}><IconRefresh /></span>
            Actualizar DNA del canal
          </h2>
          <button className="gi-modal-close" onClick={onCancel} aria-label="Cerrar"><IconX /></button>
        </div>
        <div className="gi-modal-body">
          <p style={{ fontSize: "0.85rem", color: "var(--tx2)", margin: 0, lineHeight: 1.65 }}>
            Esto reemplazará el análisis actual con los nuevos archivos que subas.
            El DNA anterior se perderá definitivamente.
          </p>
        </div>
        <div className="gi-modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={onConfirm}>
            <IconRefresh /> Sí, actualizar DNA
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Chip component ──────────────────────────────────────────── */
function DnaChip({ icon: Icon, title, children }) {
  return (
    <div className="gi-dna-chip">
      <div className="gi-dna-chip-head">
        <div className="gi-dna-chip-icon"><Icon /></div>
        <span className="gi-dna-chip-title">{title}</span>
      </div>
      {children}
    </div>
  )
}

function TagList({ items, variant }) {
  if (!items || items.length === 0) {
    return <span style={{ fontSize: "0.78rem", color: "var(--tx3)" }}>—</span>
  }
  return (
    <ul className="gi-dna-chip-list">
      {items.slice(0, 14).map((item, i) => (
        <li key={i} className={`gi-dna-tag${variant ? ` ${variant}` : ""}`}>{item}</li>
      ))}
    </ul>
  )
}

/* ── Main component ──────────────────────────────────────────── */
export default function DnaSummary({ dna, onUpdate, onDelete }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const voz       = dna?.voz_estilo || {}
  const titulos   = dna?.patrones_titulos || {}
  const estructura= dna?.estructura_guion || {}
  const negra     = dna?.lista_negra || {}
  const afirm     = dna?.afirmaciones_modelo || {}
  const formula   = dna?.formula_optima || {}

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Resumen del canal */}
      {dna?.resumen_canal && (
        <div className="gi-info-banner">
          <div className="gi-info-banner-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div className="gi-info-banner-text">{dna.resumen_canal}</div>
        </div>
      )}

      {/* Fórmula óptima */}
      {(formula.tono || formula.estructura) && (
        <div className="gi-dna-formula">
          <div className="gi-dna-formula-head">
            <div className="gi-dna-formula-icon"><IconZap /></div>
            <span className="gi-dna-formula-title">Fórmula Óptima del Canal</span>
          </div>
          <div className="gi-dna-formula-body">
            {formula.tono && (
              <div className="gi-dna-formula-item">
                <span className="gi-dna-formula-key">Tono</span>
                <span className="gi-dna-formula-val">{formula.tono}</span>
              </div>
            )}
            {formula.estructura && (
              <div className="gi-dna-formula-item">
                <span className="gi-dna-formula-key">Estructura</span>
                <span className="gi-dna-formula-val">{formula.estructura}</span>
              </div>
            )}
            {formula.direccion && (
              <div className="gi-dna-formula-item">
                <span className="gi-dna-formula-key">Dirección</span>
                <span className="gi-dna-formula-val">{formula.direccion}</span>
              </div>
            )}
            {formula.marco && (
              <div className="gi-dna-formula-item">
                <span className="gi-dna-formula-key">Marco</span>
                <span className="gi-dna-formula-val">{formula.marco}</span>
              </div>
            )}
          </div>
          {formula.rendimiento_esperado && (
            <div className="gi-dna-formula-result">
              <IconCheck />
              {formula.rendimiento_esperado}
            </div>
          )}
        </div>
      )}

      {/* Grid de chips */}
      <div className="gi-dna-grid">
        <DnaChip icon={IconMic} title="Voz y Estilo">
          {voz.tono_dominante && (
            <div className="gi-dna-text" style={{ marginBottom: 8 }}>
              Tono: <strong style={{ color: "var(--tx)" }}>{voz.tono_dominante}</strong>
            </div>
          )}
          {voz.apertura_tipica && (
            <div className="gi-dna-text" style={{ marginBottom: 10, fontStyle: "italic", borderLeft: "2px solid rgba(212,168,67,0.3)", paddingLeft: 10 }}>
              "{voz.apertura_tipica}"
            </div>
          )}
          <TagList items={voz.muletillas} />
        </DnaChip>

        <DnaChip icon={IconKey} title="Palabras clave del nicho">
          <TagList items={voz.vocabulario_nicho?.length ? voz.vocabulario_nicho : voz.palabras_clave} variant="green" />
        </DnaChip>

        <DnaChip icon={IconLayoutTemplate} title="Plantillas de Títulos">
          {(titulos.plantillas || []).slice(0, 5).map((p, i) => (
            <div key={i} className="gi-dna-text" style={{ marginBottom: 6, paddingLeft: 10, borderLeft: "2px solid rgba(212,168,67,0.2)", lineHeight: 1.45 }}>
              {p}
            </div>
          ))}
          {titulos.longitud_optima && (
            <div style={{ marginTop: 8, fontSize: "0.73rem", color: "var(--tx3)", fontFamily: "var(--ff-mono)" }}>
              Longitud óptima: {titulos.longitud_optima}
            </div>
          )}
        </DnaChip>

        <DnaChip icon={IconTag} title="Palabras de alto CTR">
          <TagList items={titulos.palabras_alto_ctr} variant="green" />
        </DnaChip>

        {estructura.estructura_cuerpo?.length > 0 && (
          <DnaChip icon={IconList} title="Estructura ganadora">
            {estructura.estructura_cuerpo.map((s, i) => (
              <div key={i} className="gi-dna-text" style={{ marginBottom: 5, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: "0.68rem", color: "var(--gold3)", fontWeight: 700, marginTop: 2, flexShrink: 0 }}>{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
            {estructura.hook_segundos && (
              <div style={{ marginTop: 8, fontSize: "0.73rem", color: "var(--tx3)", fontFamily: "var(--ff-mono)" }}>
                Hook: {estructura.hook_segundos}s · Total: {estructura.duracion_total || "—"}
              </div>
            )}
          </DnaChip>
        )}

        {afirm.ejemplos?.length > 0 && (
          <DnaChip icon={IconStar} title="Afirmaciones modelo">
            {afirm.ejemplos.slice(0, 4).map((a, i) => (
              <div key={i} className="gi-dna-text" style={{ marginBottom: 7, fontStyle: "italic", color: "var(--tx)", borderLeft: "2px solid rgba(212,168,67,0.25)", paddingLeft: 10 }}>
                "{a}"
              </div>
            ))}
          </DnaChip>
        )}

        {negra.frases_prohibidas?.length > 0 && (
          <DnaChip icon={IconSlash} title="Lista negra">
            <TagList items={negra.frases_prohibidas} variant="red" />
          </DnaChip>
        )}
      </div>

      {/* Acciones */}
      <div className="gi-actions-row" style={{ paddingTop: 12, borderTop: "1px solid var(--sep)" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(true)}>
          <IconTrash /> Eliminar DNA
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowUpdateModal(true)}>
          <IconRefresh /> Actualizar DNA del Canal
        </button>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          onConfirm={() => { setShowDeleteModal(false); onDelete() }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
      {showUpdateModal && (
        <ConfirmUpdateModal
          onConfirm={() => { setShowUpdateModal(false); onUpdate() }}
          onCancel={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  )
}
