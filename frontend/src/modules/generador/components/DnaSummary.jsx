import { useState } from "react"
import { createPortal } from "react-dom"

function ConfirmDeleteModal({ onConfirm, onCancel }) {
  const [input, setInput] = useState("")
  const valid = input.trim().toUpperCase() === "ELIMINAR"
  return createPortal(
    <div className="gi-overlay">
      <div className="gi-modal">
        <div className="gi-modal-head">
          <h2 className="gi-modal-title">⚠️ Eliminar DNA del canal</h2>
          <button className="gi-modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="gi-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: "0.85rem", color: "var(--tx2)", margin: 0, lineHeight: 1.6 }}>
            Esta acción eliminará permanentemente el análisis del canal. Tendrás que volver a subir
            los archivos para reconstruirlo.
          </p>
          <p style={{ fontSize: "0.83rem", color: "var(--tx3)", margin: 0 }}>
            Escribe <strong style={{ color: "var(--red)" }}>ELIMINAR</strong> para confirmar:
          </p>
          <input
            className="gi-confirm-input"
            placeholder="ELIMINAR"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
        </div>
        <div className="gi-modal-footer">
          <button className="gi-btn gi-btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className="gi-btn gi-btn-danger"
            onClick={onConfirm}
            disabled={!valid}
          >
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
          <h2 className="gi-modal-title">Actualizar DNA del canal</h2>
          <button className="gi-modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="gi-modal-body">
          <p style={{ fontSize: "0.85rem", color: "var(--tx2)", margin: 0, lineHeight: 1.6 }}>
            ¿Seguro? Esto reemplazará el análisis actual del canal con los nuevos archivos que
            subas. El DNA anterior se perderá.
          </p>
        </div>
        <div className="gi-modal-footer">
          <button className="gi-btn gi-btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="gi-btn gi-btn-primary" onClick={onConfirm}>
            Sí, actualizar DNA
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function TagList({ items, variant }) {
  if (!items || items.length === 0) return <span style={{ fontSize: "0.78rem", color: "var(--tx3)" }}>—</span>
  return (
    <ul className="gi-dna-chip-list">
      {items.slice(0, 12).map((item, i) => (
        <li key={i} className={`gi-dna-tag${variant ? ` ${variant}` : ""}`}>{item}</li>
      ))}
    </ul>
  )
}

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
      {/* Resumen canal */}
      {dna?.resumen_canal && (
        <div className="gi-alert gi-alert-info">
          <span>🧠</span>
          <span style={{ lineHeight: 1.6 }}>{dna.resumen_canal}</span>
        </div>
      )}

      {/* Fórmula óptima — destacada */}
      {(formula.tono || formula.estructura) && (
        <div className="gi-dna-formula">
          <div className="gi-dna-formula-title">⚡ Fórmula Óptima del Canal</div>
          <div className="gi-dna-formula-text">
            {formula.tono && <><strong>Tono:</strong> {formula.tono}&nbsp;&nbsp;</>}
            {formula.estructura && <><strong>Estructura:</strong> {formula.estructura}&nbsp;&nbsp;</>}
            {formula.direccion && <><strong>Dirección:</strong> {formula.direccion}&nbsp;&nbsp;</>}
            {formula.marco && <><strong>Marco:</strong> {formula.marco}</>}
          </div>
          {formula.rendimiento_esperado && (
            <div style={{ marginTop: 8, fontSize: "0.8rem", color: "var(--green)" }}>
              ✅ {formula.rendimiento_esperado}
            </div>
          )}
        </div>
      )}

      <div className="gi-dna-grid">
        {/* Voz y estilo */}
        <div className="gi-dna-chip">
          <div className="gi-dna-chip-title">🎙 Voz y Estilo</div>
          {voz.tono_dominante && (
            <div className="gi-dna-text" style={{ marginBottom: 8 }}>
              Tono: <strong style={{ color: "var(--tx)" }}>{voz.tono_dominante}</strong>
            </div>
          )}
          {voz.apertura_tipica && (
            <div className="gi-dna-text" style={{ marginBottom: 8 }}>
              Apertura: <em style={{ color: "var(--tx)" }}>"{voz.apertura_tipica}"</em>
            </div>
          )}
          <TagList items={voz.muletillas} />
        </div>

        {/* Palabras clave */}
        <div className="gi-dna-chip">
          <div className="gi-dna-chip-title">🔑 Palabras clave del nicho</div>
          <TagList items={voz.vocabulario_nicho || voz.palabras_clave} variant="green" />
        </div>

        {/* Plantillas de títulos */}
        <div className="gi-dna-chip">
          <div className="gi-dna-chip-title">📌 Plantillas de Títulos</div>
          {(titulos.plantillas || []).slice(0, 5).map((p, i) => (
            <div key={i} className="gi-dna-text" style={{ marginBottom: 5 }}>
              {i + 1}. {p}
            </div>
          ))}
          {titulos.longitud_optima && (
            <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--tx3)" }}>
              Longitud óptima: {titulos.longitud_optima}
            </div>
          )}
        </div>

        {/* Palabras alto CTR */}
        <div className="gi-dna-chip">
          <div className="gi-dna-chip-title">🚀 Palabras de alto CTR</div>
          <TagList items={titulos.palabras_alto_ctr} variant="green" />
        </div>

        {/* Estructura del guión */}
        {estructura.estructura_cuerpo && estructura.estructura_cuerpo.length > 0 && (
          <div className="gi-dna-chip">
            <div className="gi-dna-chip-title">🏗 Estructura ganadora</div>
            {estructura.estructura_cuerpo.map((s, i) => (
              <div key={i} className="gi-dna-text" style={{ marginBottom: 4 }}>
                {i + 1}. {s}
              </div>
            ))}
            {estructura.hook_segundos && (
              <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--tx3)" }}>
                Hook: {estructura.hook_segundos}s · Duración: {estructura.duracion_total || "—"}
              </div>
            )}
          </div>
        )}

        {/* Afirmaciones modelo */}
        {afirm.ejemplos && afirm.ejemplos.length > 0 && (
          <div className="gi-dna-chip">
            <div className="gi-dna-chip-title">✨ Afirmaciones modelo</div>
            {afirm.ejemplos.slice(0, 4).map((a, i) => (
              <div key={i} className="gi-dna-text" style={{ marginBottom: 5, fontStyle: "italic", color: "var(--tx)" }}>
                "{a}"
              </div>
            ))}
          </div>
        )}

        {/* Lista negra */}
        {(negra.frases_prohibidas || []).length > 0 && (
          <div className="gi-dna-chip">
            <div className="gi-dna-chip-title">🚫 Lista negra</div>
            <TagList items={negra.frases_prohibidas} variant="red" />
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="gi-actions-row" style={{ paddingTop: 8, borderTop: "1px solid var(--sep)" }}>
        <button className="gi-btn gi-btn-ghost gi-btn-sm" onClick={() => setShowDeleteModal(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
          </svg>
          Eliminar DNA
        </button>
        <button className="gi-btn gi-btn-secondary gi-btn-sm" onClick={() => setShowUpdateModal(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Actualizar DNA del Canal
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
