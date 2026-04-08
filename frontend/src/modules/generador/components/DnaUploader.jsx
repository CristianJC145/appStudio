import { useState, useRef } from "react"

/* ── SVG icons for each upload zone ─────────────────────────── */
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconTrendingDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
)
const IconUpload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IconFile = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>
)

const ZONES = [
  {
    id: "exitosos",
    Icon: IconStar,
    label: "Guiones exitosos",
    hint: "Sube tus guiones con más vistas — mínimo 5, ideal 15",
    accept: ".txt,.pdf,.docx,.doc",
    required: true,
  },
  {
    id: "titulos",
    Icon: IconBarChart,
    label: "Historial de títulos",
    hint: "Lista de títulos con sus vistas o CTR",
    accept: ".xlsx,.xls,.csv,.txt,.pdf",
    required: false,
  },
  {
    id: "analisis",
    Icon: IconSearch,
    label: "Análisis del canal",
    hint: "Informe de análisis profundo del canal (tono, métricas, patrones)",
    accept: ".pdf",
    required: false,
  },
  {
    id: "bajo_rendimiento",
    Icon: IconTrendingDown,
    label: "Guiones de bajo rendimiento",
    hint: "Guiones que no funcionaron — la IA aprende qué evitar",
    accept: ".txt,.pdf,.docx,.doc",
    required: false,
    optional: true,
  },
]

function UploadZone({ zone, files, onChange }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)
  const { Icon } = zone
  const hasFiles = files && files.length > 0

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    onChange(zone.id, Array.from(e.dataTransfer.files))
  }

  const handleChange = (e) => {
    onChange(zone.id, Array.from(e.target.files))
  }

  return (
    <div
      className={`gi-zone${dragOver ? " drag-over" : ""}${hasFiles ? " has-files" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      aria-label={`Zona de carga: ${zone.label}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={zone.accept}
        multiple
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="gi-zone-icon-wrap">
        <Icon />
      </div>

      <div className="gi-zone-label">
        {zone.label}
        {zone.optional && (
          <span className="gi-zone-optional"> · opcional</span>
        )}
      </div>
      <div className="gi-zone-hint">{zone.hint}</div>

      {hasFiles ? (
        <div className="gi-zone-files">
          {files.map((f, i) => (
            <div key={i} className="gi-zone-file">
              <IconCheck />
              {f.name}
            </div>
          ))}
        </div>
      ) : (
        <div className="gi-zone-cta">
          <IconUpload />
          Arrastra o haz clic
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
      <div className="gi-info-banner">
        <div className="gi-info-banner-icon">
          <IconInfo />
        </div>
        <div className="gi-info-banner-text">
          La IA analizará todos los archivos y construirá el ADN de tu canal: voz, patrones de
          títulos, estructura de guiones y fórmula óptima de rendimiento. El proceso tarda ~30 segundos.
        </div>
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

      <div className="gi-actions-row" style={{ paddingTop: 4 }}>
        <span style={{ fontSize: "0.79rem", color: "var(--tx3)", fontFamily: "var(--ff-mono)" }}>
          {totalFiles > 0
            ? `${totalFiles} archivo${totalFiles !== 1 ? "s" : ""} listo${totalFiles !== 1 ? "s" : ""}`
            : "Ningún archivo seleccionado"}
        </span>

        <button
          className="btn btn-primary btn-lg"
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
              <IconFile />
              Procesar y Guardar DNA
            </>
          )}
        </button>
      </div>

      {!hasRequired && (
        <p style={{ fontSize: "0.76rem", color: "var(--tx3)", margin: 0, textAlign: "right" }}>
          * Sube al menos un guión exitoso para continuar.
        </p>
      )}
    </div>
  )
}
