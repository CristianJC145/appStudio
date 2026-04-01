import { useState, useRef, useEffect } from "react"

function ImageCard({ img, selected, onSelect, onEnhance, onSave, enhancing }) {
  return (
    <div
      className={`bucles-img-card${selected ? " selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onSelect()}
    >
      <div className="bucles-img-wrap">
        <img
          src={img.url}
          alt={`Imagen generada ${img.index + 1}`}
          className="bucles-img-preview"
          loading="lazy"
        />
        {selected && (
          <div className="bucles-img-selected-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Seleccionada
          </div>
        )}
        {img.enhanced && (
          <div className="bucles-img-enhanced-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            Mejorada
          </div>
        )}
      </div>

      <div className="bucles-img-meta">
        <span className="bucles-img-num">Imagen {img.index + 1}</span>
        <div className="bucles-img-actions">
          {!img.enhanced && (
            <button
              type="button"
              className="bucles-img-btn"
              onClick={e => { e.stopPropagation(); onEnhance() }}
              disabled={enhancing}
              title="Mejorar calidad con gpt-image-1"
            >
              {enhancing ? (
                <span className="pulse">◉</span>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
              )}
              {enhancing ? "Mejorando..." : "Mejorar"}
            </button>
          )}
          <button
            type="button"
            className="bucles-img-btn"
            onClick={e => { e.stopPropagation(); onSave() }}
            title="Guardar en biblioteca"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ImageStep({
  api, script, styleHint, nImages, selectedLibIds, openaiKey,
  generatedImages, onImagesUpdate, selectedImage, onSelectImage,
  onNext, canNext,
}) {
  const [generating, setGenerating] = useState(false)
  const [genStatus,  setGenStatus]  = useState("")
  const [enhancing,  setEnhancing]  = useState(null)   // image_id que se está mejorando
  const [savedIds,   setSavedIds]   = useState(new Set())
  const esRef = useRef(null)

  useEffect(() => () => esRef.current?.close(), [])

  const generate = () => {
    if (generating) return
    setGenerating(true)
    setGenStatus("Iniciando...")
    onImagesUpdate([])
    onSelectImage(null)

    const es = new EventSource(
      `${api}/api/bucles/generate-images`,
    )
    esRef.current = es

    // Usamos POST via fetch+SSE (simulado): llamamos al endpoint via fetch normal y leemos SSE
    es.close()

    // El endpoint es POST — hacemos fetch con streaming manual
    const body = JSON.stringify({
      script, style_hint: styleHint, n_images: nImages,
      openai_key: openaiKey, library_ids: selectedLibIds,
    })

    fetch(`${api}/api/bucles/generate-images`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).then(async res => {
      const reader = res.body.getReader()
      const dec    = new TextDecoder()
      let buf = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop()

        for (const line of lines) {
          if (!line.startsWith("data:")) continue
          try {
            const ev = JSON.parse(line.slice(5).trim())
            if (ev.event === "status" || ev.event === "generating") {
              setGenStatus(ev.message)
            } else if (ev.event === "image_ready") {
              onImagesUpdate(prev => [...prev, {
                id:       ev.image_id,
                url:      `${api}${ev.url}?t=${Date.now()}`,
                prompt:   ev.prompt,
                index:    ev.index,
                enhanced: false,
              }])
            } else if (ev.event === "image_error") {
              setGenStatus(ev.message)
            } else if (ev.event === "done") {
              setGenStatus("Generación completada")
              setGenerating(false)
            }
          } catch {}
        }
      }
      setGenerating(false)
    }).catch(err => {
      setGenStatus("Error de conexión")
      setGenerating(false)
    })
  }

  const enhance = async (img) => {
    setEnhancing(img.id)
    try {
      const r = await fetch(`${api}/api/bucles/enhance-image`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image_id: img.id, openai_key: openaiKey }),
      })
      if (r.ok) {
        const data = await r.json()
        onImagesUpdate(prev => prev.map(i =>
          i.id === img.id
            ? { ...i, url: `${api}/api/bucles/image/${img.id}?t=${Date.now()}`, enhanced: true }
            : i
        ))
        if (selectedImage?.id === img.id) {
          onSelectImage(prev => ({ ...prev, url: `${api}/api/bucles/image/${img.id}?t=${Date.now()}`, enhanced: true }))
        }
      }
    } catch {}
    setEnhancing(null)
  }

  const saveToLibrary = async (img) => {
    try {
      const r = await fetch(`${api}/api/bucles/library/save`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image_id: img.id, tags: "" }),
      })
      if (r.ok) setSavedIds(prev => new Set([...prev, img.id]))
    } catch {}
  }

  return (
    <div className="bucles-step-panel fade-up">
      <div className="bucles-panel-header">
        <div>
          <h2 className="bucles-panel-title">Seleccionar imagen</h2>
          <p className="bucles-panel-desc">
            Genera variaciones y elige la que mejor representa tu meditación. Puedes mejorar la calidad con IA.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={generate}
          disabled={generating}
        >
          {generating ? (
            <><span className="pulse">◉</span> Generando...</>
          ) : generatedImages.length > 0 ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m4 4V7"/>
              </svg>
              Regenerar
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
              Generar imágenes
            </>
          )}
        </button>
      </div>

      {/* Status */}
      {genStatus && (
        <div className="bucles-gen-status">
          {generating && <span className="pulse" style={{ color: "var(--gold3)", marginRight: 8 }}>◉</span>}
          {genStatus}
        </div>
      )}

      {/* Grid de imágenes */}
      {generatedImages.length > 0 ? (
        <div className="bucles-img-grid">
          {generatedImages.map(img => (
            <ImageCard
              key={img.id}
              img={img}
              selected={selectedImage?.id === img.id}
              onSelect={() => onSelectImage(img)}
              onEnhance={() => enhance(img)}
              onSave={() => saveToLibrary(img)}
              enhancing={enhancing === img.id}
            />
          ))}
        </div>
      ) : !generating ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
          </div>
          <div>Las imágenes generadas aparecerán aquí</div>
          <div className="text-xs text-muted mt-8">Haz clic en "Generar imágenes" para comenzar</div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="bucles-step-footer">
        {savedIds.size > 0 && (
          <span className="bucles-saved-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {savedIds.size} guardada{savedIds.size !== 1 ? "s" : ""} en biblioteca
          </span>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!canNext}
          style={{ marginLeft: "auto" }}
        >
          Crear bucle
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
