import { useState } from "react"

export default function ScriptStep({
  script, onScript, styleHint, onStyleHint,
  nImages, onNImages, selectedLibIds,
  config, onConfig, onNext, canNext,
}) {
  const [showKeys, setShowKeys] = useState(false)

  const charCount = script.trim().length
  const MIN_CHARS = 50

  return (
    <div className="bucles-step-panel fade-up">

      {/* Header */}
      <div className="bucles-panel-header">
        <div>
          <h2 className="bucles-panel-title">Guion y configuración</h2>
          <p className="bucles-panel-desc">
            Pega el guion de tu meditación. Se usará para generar imágenes coherentes con el contenido.
          </p>
        </div>
      </div>

      <div className="bucles-two-col">

        {/* Columna izquierda: guion */}
        <div className="bucles-col-main">
          <div className="bucles-field">
            <label className="bucles-label">Guion de meditación</label>
            <textarea
              className="bucles-textarea"
              placeholder="Pega aquí el guion completo de la meditación o una descripción del ambiente que deseas crear..."
              value={script}
              onChange={e => onScript(e.target.value)}
              rows={14}
            />
            <div className="bucles-field-footer">
              <span className={`bucles-char-count${charCount < MIN_CHARS ? " warn" : " ok"}`}>
                {charCount} caracteres {charCount < MIN_CHARS ? `— mínimo ${MIN_CHARS}` : ""}
              </span>
            </div>
          </div>

          <div className="bucles-field">
            <label className="bucles-label">Instrucción de estilo <span className="bucles-optional">(opcional)</span></label>
            <input
              className="bucles-input"
              type="text"
              placeholder="Ej: tonos cálidos dorados, bosque al amanecer, espacio exterior etéreo..."
              value={styleHint}
              onChange={e => onStyleHint(e.target.value)}
            />
          </div>
        </div>

        {/* Columna derecha: config */}
        <div className="bucles-col-side">

          {/* Nº de imágenes */}
          <div className="bucles-config-card">
            <div className="bucles-config-card-title">Cantidad de imágenes</div>
            <div className="bucles-config-card-desc">
              Se generarán varias versiones para que puedas elegir la mejor.
            </div>
            <div className="bucles-n-selector">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`bucles-n-btn${nImages === n ? " active" : ""}`}
                  onClick={() => onNImages(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Contexto de biblioteca */}
          {selectedLibIds.length > 0 && (
            <div className="bucles-config-card bucles-config-card--lib">
              <div className="bucles-config-card-title">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Contexto de biblioteca activo
              </div>
              <div className="bucles-config-card-desc">
                {selectedLibIds.length} imagen{selectedLibIds.length !== 1 ? "es" : ""} seleccionada{selectedLibIds.length !== 1 ? "s" : ""} como referencia de estilo.
              </div>
            </div>
          )}

          {/* API Keys */}
          <div className="bucles-config-card">
            <button
              type="button"
              className="bucles-keys-toggle"
              onClick={() => setShowKeys(p => !p)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              API Keys
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto", transform: showKeys ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {showKeys && (
              <div className="bucles-keys-body">
                <div className="bucles-field">
                  <label className="bucles-label-sm">OpenAI API Key <span className="bucles-required">*</span></label>
                  <input
                    className="bucles-input bucles-input-sm bucles-input-secret"
                    type="password"
                    placeholder="sk-..."
                    value={config.openai_key}
                    onChange={e => onConfig({ openai_key: e.target.value })}
                    autoComplete="off"
                  />
                  <span className="bucles-hint">Para DALL-E 3 y gpt-image-1</span>
                </div>
                <div className="bucles-field">
                  <label className="bucles-label-sm">xAI (Grok) API Key <span className="bucles-optional">(opcional)</span></label>
                  <input
                    className="bucles-input bucles-input-sm bucles-input-secret"
                    type="password"
                    placeholder="xai-..."
                    value={config.grok_key}
                    onChange={e => onConfig({ grok_key: e.target.value })}
                    autoComplete="off"
                  />
                  <span className="bucles-hint">Analiza la imagen para optimizar el movimiento del bucle</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CTA */}
      <div className="bucles-step-footer">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!canNext || !config.openai_key}
        >
          Generar imágenes
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        {!config.openai_key && (
          <span className="bucles-cta-hint">Configura tu OpenAI API Key para continuar</span>
        )}
      </div>
    </div>
  )
}
