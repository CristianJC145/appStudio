import { useState, useEffect } from "react"

function Slider({ label, value, onChange, min, max, step = 0.01, tooltip }) {
  return (
    <div className="field">
      <label title={tooltip}>{label}</label>
      <div className="slider-row">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        <span className="slider-val">{value}</span>
      </div>
    </div>
  )
}

function NumInput({ label, value, onChange, min, max, step = 1 }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="number"
        value={value}
        min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="toggle-row" style={{ marginBottom: 12 }}>
      <span className="toggle-label">{label}</span>
      <label className="toggle">
        <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-track" />
      </label>
    </div>
  )
}

function Section({ title, children, open, onToggle }) {
  return (
    <div className="config-section">
      <div className="config-section-header" onClick={onToggle}>
        <span className="config-section-title">{title}</span>
        <span className={`config-chevron ${open ? "open" : ""}`}>▼</span>
      </div>
      {open && <div className="config-section-body">{children}</div>}
    </div>
  )
}


export default function ConfigPanel({ config, setConfig }) {
  const set = (key, val) => setConfig(prev => ({ ...prev, [key]: val }))
  const setVS = (key, val) =>
    setConfig(prev => ({ ...prev, voice_settings: { ...prev.voice_settings, [key]: val } }))

  const [voices, setVoices] = useState([])
  const [loadingVoices, setLoadingVoices] = useState(false)

  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem("config_sections_open")
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  const toggleSection = (title) => {
    setOpenSections(prev => {
      const next = { ...prev, [title]: !prev[title] }
      localStorage.setItem("config_sections_open", JSON.stringify(next))
      return next
    })
  }

  const fetchVoices = async () => {
    if (!config.api_key) return
    setLoadingVoices(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/voices?api_key=${config.api_key}`)
      const data = await res.json()
      setVoices(data)
    } catch {}
    setLoadingVoices(false)
  }

  return (
    <div className="card fade-up" style={{ animationDelay: "0.08s" }}>
      <div className="card-header">
        <div className="card-title">Configuración</div>
        <div className="card-subtitle">ElevenLabs + Audio</div>
      </div>

      <Section title="API & Voz" open={openSections["API & Voz"]} onToggle={() => toggleSection("API & Voz")}>
        <div className="field" style={{ marginTop: 6 }}>
          <label>API Key</label>
          <input
            type="password"
            value={config.api_key}
            onChange={e => set("api_key", e.target.value)}
            placeholder="Pega tu API key de ElevenLabs"
          />
        </div>

        <div className="field">
          <label>Modelo</label>
          <select value={config.model_id} onChange={e => set("model_id", e.target.value)}>
            <option value="eleven_multilingual_v2">Multilingual v2</option>
            <option value="eleven_turbo_v2_5">Turbo v2.5 (rápido)</option>
            <option value="eleven_flash_v2_5">Flash v2.5</option>
          </select>
        </div>

        <div className="field">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Voice ID</label>
            <button
              className="btn btn-ghost btn-sm"
              onClick={fetchVoices}
              disabled={loadingVoices || !config.api_key}
            >
              {loadingVoices ? "Cargando..." : "Cargar voces"}
            </button>
          </div>
          {voices.length > 0 ? (
            <select value={config.voice_id} onChange={e => set("voice_id", e.target.value)}>
              {voices.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={config.voice_id}
              onChange={e => set("voice_id", e.target.value)}
              placeholder="voice ID o carga desde API"
            />
          )}
        </div>

        <div className="field">
          <label>Idioma</label>
          <select value={config.language_code} onChange={e => set("language_code", e.target.value)}>
            <option value="es">Español (es)</option>
            <option value="en">English (en)</option>
            <option value="pt">Português (pt)</option>
            <option value="fr">Français (fr)</option>
          </select>
        </div>
      </Section>

      <Section title="Parámetros de Voz" open={openSections["Parámetros de Voz"]} onToggle={() => toggleSection("Parámetros de Voz")}>
        <div style={{ marginTop: 6 }}>
          <Slider label="Estabilidad" value={config.voice_settings.stability}
            onChange={v => setVS("stability", v)} min={0} max={1}
            tooltip="Mayor = más consistente, menor = más expresiva" />
          <Slider label="Similarity Boost" value={config.voice_settings.similarity_boost}
            onChange={v => setVS("similarity_boost", v)} min={0} max={1} />
          <Slider label="Style" value={config.voice_settings.style}
            onChange={v => setVS("style", v)} min={0} max={1} />
          <Toggle label="Speaker Boost" value={config.voice_settings.use_speaker_boost}
            onChange={v => setVS("use_speaker_boost", v)} />
        </div>
      </Section>

      <Section title="Intro — Velocidad & Tempo" open={openSections["Intro — Velocidad & Tempo"]} onToggle={() => toggleSection("Intro — Velocidad & Tempo")}>
        <div style={{ marginTop: 6 }}>
          <Slider label="Voice Speed (ElevenLabs)" value={config.intro_voice_speed}
            onChange={v => set("intro_voice_speed", v)} min={0.7} max={1.3} step={0.01}
            tooltip="Velocidad enviada a la API" />
          <Slider label="Tempo Factor (post-proceso)" value={config.intro_tempo_factor}
            onChange={v => set("intro_tempo_factor", v)} min={0.6} max={1.3} step={0.01}
            tooltip="Time-stretching con ffmpeg. 1.0 = sin cambio" />
        </div>
      </Section>

      <Section title="Meditación — Velocidad & Tempo" open={openSections["Meditación — Velocidad & Tempo"]} onToggle={() => toggleSection("Meditación — Velocidad & Tempo")}>
        <div style={{ marginTop: 6 }}>
          <Slider label="Voice Speed (ElevenLabs)" value={config.medit_voice_speed}
            onChange={v => set("medit_voice_speed", v)} min={0.7} max={1.3} step={0.01}
            tooltip="Velocidad enviada a la API para la sección de meditación" />
          <Slider label="Tempo Factor (post-proceso)" value={config.medit_tempo_factor}
            onChange={v => set("medit_tempo_factor", v)} min={0.6} max={1.3} step={0.01}
            tooltip="Time-stretching con ffmpeg para la meditación" />
        </div>
      </Section>
      <Section title="Afirmaciones — Velocidad & Tempo" open={openSections["Afirmaciones — Velocidad & Tempo"]} onToggle={() => toggleSection("Afirmaciones — Velocidad & Tempo")}>
        <div style={{ marginTop: 6 }}>
          <Slider label="Voice Speed (ElevenLabs)" value={config.afirm_voice_speed}
            onChange={v => set("afirm_voice_speed", v)} min={0.7} max={1.3} step={0.01} />
          <Slider label="Tempo Factor (post-proceso)" value={config.afirm_tempo_factor}
            onChange={v => set("afirm_tempo_factor", v)} min={0.6} max={1.3} step={0.01} />
        </div>
      </Section>


      <Section title="Silencios (ms)" open={openSections["Silencios (ms)"]} onToggle={() => toggleSection("Silencios (ms)")}>
        <div style={{ marginTop: 6 }}>
          <div className="field-row">
            <NumInput label="Entre oraciones" value={config.pausa_entre_oraciones}
              onChange={v => set("pausa_entre_oraciones", v)} min={0} max={5000} step={100} />
            <NumInput label="Intro → Afirm" value={config.pausa_intro_a_afirm}
              onChange={v => set("pausa_intro_a_afirm", v)} min={0} max={10000} step={500} />
          </div>
          <div className="field-row">
            <NumInput label="Entre afirmaciones (ms)" value={config.pausa_entre_afirmaciones}
              onChange={v => set("pausa_entre_afirmaciones", v)} min={1000} max={30000} step={500} />
            <NumInput label="Afirm → Meditación" value={config.pausa_afirm_a_medit}
              onChange={v => set("pausa_afirm_a_medit", v)} min={0} max={10000} step={500} />
          </div>
          <NumInput label="Entre segmentos meditación (ms)" value={config.pausa_entre_meditaciones}
            onChange={v => set("pausa_entre_meditaciones", v)} min={500} max={30000} step={500} />
        </div>
      </Section>

      <Section title="Pausas SSML" open={openSections["Pausas SSML"]} onToggle={() => toggleSection("Pausas SSML")}>
        <div style={{ marginTop: 6 }}>
          <Toggle label="Insertar breaks por puntuación" value={config.usar_ssml_breaks}
            onChange={v => set("usar_ssml_breaks", v)} />
          {config.usar_ssml_breaks && (
            <>
              <Slider label="Coma , (s)" value={config.break_coma}
                onChange={v => set("break_coma", v)} min={0} max={3} step={0.05} />
              <Slider label="Punto . (s)" value={config.break_punto}
                onChange={v => set("break_punto", v)} min={0} max={3} step={0.05} />
              <Slider label="Puntos suspensivos … (s)" value={config.break_suspensivos}
                onChange={v => set("break_suspensivos", v)} min={0} max={3} step={0.05} />
              <Slider label="Dos puntos : (s)" value={config.break_dos_puntos}
                onChange={v => set("break_dos_puntos", v)} min={0} max={3} step={0.05} />
              <Slider label="Punto y coma ; (s)" value={config.break_punto_coma}
                onChange={v => set("break_punto_coma", v)} min={0} max={3} step={0.05} />
              <Slider label="Guión largo — (s)" value={config.break_guion}
                onChange={v => set("break_guion", v)} min={0} max={3} step={0.05} />
              <Slider label="Exclamación ! (s)" value={config.break_exclamacion}
                onChange={v => set("break_exclamacion", v)} min={0} max={3} step={0.05} />
              <Slider label="Interrogación ? (s)" value={config.break_interrogacion}
                onChange={v => set("break_interrogacion", v)} min={0} max={3} step={0.05} />
              <Slider label="Salto de párrafo (s)" value={config.break_parrafo}
                onChange={v => set("break_parrafo", v)} min={0} max={5} step={0.1} />
            </>
          )}
        </div>
      </Section>

      <Section title="Silencios Internos" open={openSections["Silencios Internos"]} onToggle={() => toggleSection("Silencios Internos")}>
        <div style={{ marginTop: 6 }}>
          <Toggle label="Extender silencios internos" value={config.extend_silence}
            onChange={v => set("extend_silence", v)} />
          {config.extend_silence && (
            <>
              <Slider label="Factor coma (< 400ms)" value={config.factor_coma}
                onChange={v => set("factor_coma", v)} min={0.5} max={3} step={0.1} />
              <Slider label="Factor punto (400–900ms)" value={config.factor_punto}
                onChange={v => set("factor_punto", v)} min={0.5} max={3} step={0.1} />
              <Slider label="Factor suspensivos (> 900ms)" value={config.factor_suspensivos}
                onChange={v => set("factor_suspensivos", v)} min={0.5} max={3} step={0.1} />
            </>
          )}
        </div>
      </Section>

      <Section title="Avanzado" open={openSections["Avanzado"]} onToggle={() => toggleSection("Avanzado")}>
        <div style={{ marginTop: 6 }}>
          <NumInput label="Máx. caracteres por párrafo" value={config.max_chars_parrafo}
            onChange={v => set("max_chars_parrafo", v)} min={100} max={800} />
          <NumInput label="Umbral silencio (dBFS)" value={config.silence_thresh_db}
            onChange={v => set("silence_thresh_db", v)} min={-80} max={-10} />
          <NumInput label="Silencio mínimo (ms)" value={config.silence_min_ms}
            onChange={v => set("silence_min_ms", v)} min={20} max={500} />
        </div>
      </Section>

      <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)" }}>
        <div className="text-xs text-muted">
          La config se guarda automáticamente en el navegador
        </div>
      </div>
    </div>
  )
}
