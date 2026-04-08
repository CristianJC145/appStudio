import { useState, useEffect, useRef } from "react"

const MIN_LIBRARY_IMAGES = 5

export default function LibraryModal({ api, selectedIds, onToggle, onClose, onLibraryChange }) {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [deleting,  setDeleting]  = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState("")
  const [dragOver,  setDragOver]  = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { loadLibrary() }, [])

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/bucles/library`)
      if (r.ok) {
        const data = await r.json()
        setItems(data.items || [])
      }
    } catch {}
    setLoading(false)
  }

  const uploadFiles = async (files) => {
    const valid = [...files].filter(f => f.type.startsWith("image/"))
    if (!valid.length) { setUploadErr("Solo se aceptan imágenes (JPG, PNG, WEBP)."); return }
    setUploading(true)
    setUploadErr("")
    let added = 0
    for (const file of valid) {
      try {
        const form = new FormData()
        form.append("file", file)
        form.append("tags", "")
        const r = await fetch(`${api}/api/bucles/library/upload`, { method: "POST", body: form })
        if (r.ok) {
          const data = await r.json()
          setItems(prev => [{
            id: data.image_id, tags: "", source: "upload",
            filename: file.name, created_at: Date.now() / 1000, saved_at: Date.now() / 1000,
          }, ...prev])
          added++
        } else {
          const err = await r.json().catch(() => ({}))
          setUploadErr(err.detail || "Error al subir una imagen.")
        }
      } catch { setUploadErr("Error de conexión al subir.") }
    }
    setUploading(false)
    if (added > 0 && onLibraryChange) onLibraryChange()
  }

  const deleteItem = async (id) => {
    setDeleting(id)
    try {
      await fetch(`${api}/api/bucles/library/${id}`, { method: "DELETE" })
      setItems(prev => prev.filter(i => i.id !== id))
      if (onLibraryChange) onLibraryChange()
    } catch {}
    setDeleting(null)
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }

  const remaining = Math.max(0, MIN_LIBRARY_IMAGES - items.length)
  const isReady   = items.length >= MIN_LIBRARY_IMAGES

  return (
    <div className="bucles-modal-overlay" onClick={onClose}>
      <div className="bucles-modal bucles-modal--wide" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bucles-modal-header">
          <div>
            <h3 className="bucles-modal-title">Biblioteca de estilos</h3>
            <p className="bucles-modal-desc">
              Imágenes de referencia que guían el estilo visual de las generaciones.
              Cuantas más imágenes, más preciso será el resultado.
            </p>
          </div>
          <button type="button" className="bucles-modal-close" onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Banner de advertencia si no hay suficientes */}
        {!loading && !isReady && (
          <div className="bucles-lib-warning">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <strong>Biblioteca insuficiente.</strong>{" "}
              {items.length === 0
                ? `Sube al menos ${MIN_LIBRARY_IMAGES} imágenes de referencia antes de generar. Sin ellas, DALL-E no sabrá qué estilo visual seguir.`
                : `Faltan ${remaining} imagen${remaining !== 1 ? "es" : ""} para el mínimo recomendado (${MIN_LIBRARY_IMAGES}). Puedes generar igualmente, pero el estilo será menos preciso.`}
            </div>
          </div>
        )}

        {/* Selección activa */}
        {selectedIds.length > 0 && (
          <div className="bucles-modal-selection-info">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {selectedIds.length} imagen{selectedIds.length !== 1 ? "es" : ""} seleccionada{selectedIds.length !== 1 ? "s" : ""} como contexto activo
          </div>
        )}

        <div className="bucles-modal-body">

          {/* Zona de upload drag & drop */}
          <div
            className={`bucles-upload-zone${dragOver ? " drag-over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: "none" }}
              onChange={e => uploadFiles(e.target.files)}
            />
            {uploading ? (
              <>
                <span className="pulse" style={{ color: "var(--gold3)", fontSize: "1.2rem" }}>◉</span>
                <span className="bucles-upload-label">Subiendo imágenes...</span>
              </>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--tx3)" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="bucles-upload-label">
                  {dragOver ? "Suelta las imágenes aquí" : "Arrastra imágenes o haz clic para subir"}
                </span>
                <span className="bucles-upload-hint">JPG · PNG · WEBP · Múltiples archivos</span>
              </>
            )}
          </div>

          {uploadErr && (
            <div className="bucles-upload-error">{uploadErr}</div>
          )}

          {/* Grid de biblioteca */}
          {loading ? (
            <div className="empty-state" style={{ paddingTop: 32 }}>
              <span className="pulse" style={{ color: "var(--gold3)", fontSize: "1.2rem" }}>◉</span>
              <div className="text-xs text-muted">Cargando...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 24 }}>
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <div style={{ fontSize: "0.82rem" }}>La biblioteca está vacía</div>
              <div className="text-xs text-muted mt-8">
                Sube imágenes de referencia arriba para comenzar.
              </div>
            </div>
          ) : (
            <div className="bucles-lib-grid" style={{ marginTop: 16 }}>
              {items.map(item => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className={`bucles-lib-item${isSelected ? " selected" : ""}`}
                    onClick={() => onToggle(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && onToggle(item.id)}
                  >
                    <div className="bucles-lib-img-wrap">
                      <img
                        src={`${api}/api/bucles/image/${item.id}?t=${item.saved_at || item.created_at}`}
                        alt={item.filename || `Referencia ${item.id.slice(0,6)}`}
                        className="bucles-lib-img"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="bucles-lib-check">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                      {item.source === "upload" && (
                        <div className="bucles-lib-source-badge">Subida</div>
                      )}
                    </div>
                    <div className="bucles-lib-meta">
                      <span className="bucles-lib-tags" title={item.filename}>
                        {item.tags || item.filename?.split(".")[0] || "—"}
                      </span>
                      <button
                        type="button"
                        className="bucles-lib-delete"
                        onClick={e => { e.stopPropagation(); deleteItem(item.id) }}
                        disabled={deleting === item.id}
                        aria-label="Eliminar"
                        title="Eliminar de biblioteca"
                      >
                        {deleting === item.id ? (
                          <span className="pulse" style={{ fontSize: "0.7rem" }}>◉</span>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bucles-modal-footer">
          <div className="bucles-lib-footer-stats">
            <span className={`bucles-lib-count${isReady ? " ready" : " warn"}`}>
              {items.length} / {MIN_LIBRARY_IMAGES} imágenes mínimas
            </span>
            {isReady && (
              <span className="bucles-lib-ready-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Lista
              </span>
            )}
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
