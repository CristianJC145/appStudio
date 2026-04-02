/**
 * Parsea el guión generado en secciones estructuradas.
 * Formato esperado: **[NOMBRE_SECCIÓN]** seguido de texto.
 */

const SECTION_ORDER = ["HOOK", "REVELACIÓN", "PREPARACIÓN", "AFIRMACIONES", "CIERRE"]

export function parseScript(rawText) {
  if (!rawText) return { sections: [], titles: [] }

  const lines = rawText.split("\n")
  const sections = []
  const titles   = []

  let currentSection = null
  let inTitles = false
  let titleCount = 0

  for (const line of lines) {
    const stripped = line.trim()
    if (!stripped) continue

    // Línea separadora
    if (stripped === "---") {
      currentSection = null
      continue
    }

    // Bloque de títulos sugeridos
    if (/\*\*TÍTULOS SUGERIDOS/i.test(stripped)) {
      inTitles = true
      currentSection = null
      continue
    }

    // Número de título (1. 2. 3.)
    const titleMatch = stripped.match(/^(\d+)\.\s+(.+)/)
    if (inTitles && titleMatch) {
      titles.push(titleMatch[2])
      titleCount++
      if (titleCount >= 3) inTitles = false
      continue
    }

    // Encabezado de sección **[NOMBRE]**
    const secMatch = stripped.match(/^\*\*\[([^\]]+)\]\*\*$/)
    if (secMatch) {
      currentSection = { name: secMatch[1], text: "" }
      sections.push(currentSection)
      inTitles = false
      continue
    }

    // Texto de sección
    if (currentSection) {
      currentSection.text += (currentSection.text ? "\n" : "") + line
    }
  }

  // Limpiar texto de cada sección
  for (const s of sections) {
    s.text = s.text.trim()
  }

  // Ordenar según el orden esperado
  sections.sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a.name.toUpperCase())
    const bi = SECTION_ORDER.indexOf(b.name.toUpperCase())
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return { sections, titles }
}

export function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function sectionEmoji(name) {
  const map = {
    "HOOK":        "🎯",
    "REVELACIÓN":  "💡",
    "PREPARACIÓN": "🌊",
    "AFIRMACIONES":"✨",
    "CIERRE":      "🔮",
  }
  return map[name?.toUpperCase()] || "📝"
}
