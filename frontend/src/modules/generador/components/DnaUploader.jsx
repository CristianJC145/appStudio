import { useState, useRef } from "react"

const ZONES = [
  {
    id: "exitosos",
    icon: "⭐",
    label: "Guiones exitosos",
    hint: "Sube tus guiones con más vistas (mínimo 5, ideal 15)",
    accept: ".txt,.pdf,.docx,.doc",
    required: true,
  },
  {
    id: "titulos",
    icon: "📊",
    label: "Historial de títulos",
    hint: "Lista de títulos con sus vistas o CTR",
    accept: ".xlsx,.xls,.csv,.txt,.pdf",
    required: false,
  },
  {
    id: "analisis",
    icon: "🔬",
    label: "Análisis del canal (PDF)",
    hint: "Informe de análisis profundo del canal (tono, métricas, patrones)",
    accept: ".pdf",
    required: false,
  },
  {
    id: "bajo_rendimiento",
    icon: "📉",
    label: "Guiones de bajo rendimiento",
    hint: "Guiones que no funcionaron bien (para que la IA aprenda qué evitar)",
    accept: ".txt,.pdf,.docx,.doc",
    required: false,
    optional: true,
  },
]

function UploadZone({ zone, files, onChange }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    onChange(zone.id, dropped)
  }

  const handleChange = (e) => {
    onChange(zone.id, Array.from(e.target.files))
  }

  const hasFiles = files && files.length > 0

  return (
    <div
      className={`gi-zone${dragOver ? " drag-over" : ""}${hasFiles ? " has-files" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={zone.accept}
        multiple
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        style={{ display: "none" }}
      />
      <div className="gi-zone-icon">{zone.icon}</div>
      <div className="gi-zone-label">
        {zone.label}
        {!zone.required && <span className="gi-zone-optional"> · opcional</span>}
      </div>
      <div className="gi-zone-hint">{zone.hint}</div>
      {hasFiles && (
        <div className="gi-zone-files">
          {files.map((f, i) => (
            <div key={i} className="gi-zone-file">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {f.name}
            </div>
          ))}
        </div>
      )}
      {!hasFiles && (
        <div style={{ marginTop: 8, fontSize: "0.72rem", color: "var(--tx3)" }}>
          Arrastra archivos o haz clic para seleccionar
        </div>
      )}
    </div>
  )
}

export default function DnaUploader({ onProcess, processing }) {
  const [filesByZone, setFilesByZone] = useState({})

  const handleZoneChange = (zoneId, files) => {
    setFilesByZone(prev => ({ ...prev, [zoneId]: files }))
  }

  const totalFiles = Object.values(filesByZone).flat().length
  const hasRequired = (filesByZone["exitosos"] || []).length > 0

  const handleSubmit = () => {
    if (!hasRequired || processing) return
    onProcess(filesByZone)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="gi-alert gi-alert-info">
        <span>💡</span>
        <span>
          La IA analizará todos los archivos y extraerá el ADN de tu canal: voz, patrones de
          títulos, estructura de guiones y fórmula óptima. Este proceso tarda ~30 segundos.
        </span>
      </div>

      <div className="gi-zones-grid">
        {ZONES.map(zone => (
          <UploadZone
            key={zone.id}
            zone={zone}
            files={filesByZone[zone.id] || []}
            onChange={handleZoneChange}
          />
        ))}
      </div>

      <div className="gi-actions-row">
        <span style={{ fontSize: "0.8rem", color: "var(--tx3)" }}>
          {totalFiles > 0 ? `${totalFiles} archivo${totalFiles !== 1 ? "s" : ""} seleccionado${totalFiles !== 1 ? "s" : ""}` : "Ningún archivo seleccionado"}
        </span>
        <button
          className="gi-btn gi-btn-primary gi-btn-lg"
          onClick={handleSubmit}
          disabled={!hasRequired || processing}
        >
          {processing ? (
            <>
              <span className="gi-spinner" />
              Procesando DNA…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
              Procesar y Guardar DNA
            </>
          )}
        </button>
      </div>

      {!hasRequired && (
        <p style={{ fontSize: "0.77rem", color: "var(--tx3)", margin: 0, textAlign: "right" }}>
          * Debes subir al menos un guión exitoso para continuar.
        </p>
      )}
    </div>
  )
}
