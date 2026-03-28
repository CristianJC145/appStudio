import logo from "../../../assets/logo.png"

export default function ScriptEditor({ guion, setGuion, nombre, setNombre, onGenerate, generating }) {
  const charCount = guion.length
  const lineCount = guion.split("\n").length

  const SAMPLE = `[INTRO]
Bienvenido a este espacio de paz y serenidad. Toma un momento para acomodarte, cierra los ojos y respira profundo.

Permite que cada respiración te lleve más hacia adentro, hacia un lugar de calma y certeza.

Hoy reforzamos lo que ya sabes: eres suficiente, eres capaz, eres digno.

[MEDITACION]
Siente el peso de la tierra bajo tus pies.
Deja que el aire entre en tu cuerpo y salga de él.
Consciente de tu respiración, conectado con tu esencia.

[AFIRMACIONES]
Soy paz, soy luz, soy amor incondicional.
Mi mente es clara y mi corazón está abierto.
Cada día avanzo con confianza y gratitud.
Merezco todo lo bueno que la vida me ofrece.
Soy el arquitecto de mi propia felicidad.`

  return (
    <div className="card fade-up">
      <div className="card-header">
        <div>
          <div className="card-title">Guion de Meditación</div>
          <div className="card-subtitle" style={{ marginTop: 3 }}>
            Usa [INTRO] y [AFIRMACIONES] para separar secciones
          </div>
        </div>
        <div className="flex gap-8">
          <span className="text-xs text-muted" style={{ alignSelf: "center" }}>
            {charCount} ch · {lineCount} líneas
          </span>
          {!guion && (
            <button className="btn btn-ghost btn-sm" onClick={() => setGuion(SAMPLE)}>
              Ejemplo
            </button>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="field">
          <label>Nombre del archivo</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "_"))}
            placeholder="meditacion_01"
          />
        </div>

        <div className="field">
          <div className="script-textarea-wrap">
            <img src={logo} className="script-textarea-watermark" alt="" />
            <textarea
              className="script-textarea"
              value={guion}
              onChange={e => setGuion(e.target.value)}
              placeholder={`Pega tu guion aquí...\n\nEstructura recomendada:\n[INTRO]\nTexto introductorio...\n\n[AFIRMACIONES]\nPrimera afirmación\nSegunda afirmación`}
              spellCheck={false}
            />
          </div>
          <div className="script-hint">
            <span>[INTRO]</span> → voz narrativa, fluida ·{" "}
            <span>[AFIRMACIONES]</span> → una por línea, con pausa de {" "}
            <span>10s</span> entre cada una
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {guion && (
            <button
              className="btn btn-ghost"
              onClick={() => { if (confirm("¿Limpiar el guion?")) setGuion("") }}
              disabled={generating}
            >
              Limpiar
            </button>
          )}
          <button
            className="btn btn-primary btn-lg"
            onClick={onGenerate}
            disabled={generating || !guion.trim()}
          >
            {generating ? (
              <>
                <span className="pulse">◉</span> Generando...
              </>
            ) : (
              <>▶ Generar Audio</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
