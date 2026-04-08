"""
Script Generator — genera guiones con Claude usando DNA del canal + análisis del video.
Usa prompt caching de Anthropic para el DNA (reduce costos ~90% en llamadas repetidas).
"""
import json
import re

import anthropic


def _format_lista_negra(lista_negra: dict) -> str:
    frases = lista_negra.get("frases_prohibidas", [])
    tonos  = lista_negra.get("tonos_evitar", [])
    partes = []
    if frases:
        partes.append("Frases: " + ", ".join(f'"{f}"' for f in frases[:10]))
    if tonos:
        partes.append("Tonos: " + ", ".join(tonos[:5]))
    return "; ".join(partes) or "ninguna especificada"


def _format_formula(formula: dict) -> str:
    return (
        f"Tono: {formula.get('tono', '')} | "
        f"Estructura: {formula.get('estructura', '')} | "
        f"Dirección: {formula.get('direccion', '')} | "
        f"Marco: {formula.get('marco', '')}"
    )


def generate_script(
    dna: dict,
    video_info: dict,
    video_content: dict,
    duracion: str,
    instruccion: str,
    api_key: str,
) -> str:
    """
    Genera el guión completo.
    Retorna el texto del guión formateado con secciones.
    """
    client = anthropic.Anthropic(api_key=api_key)

    formula_optima  = _format_formula(dna.get("formula_optima", {}))
    lista_negra_str = _format_lista_negra(dna.get("lista_negra", {}))
    tono_dominante  = dna.get("voz_estilo", {}).get("tono_dominante", "empoderador y reflexivo")

    analysis = video_content.get("analysis", {})
    transcript_excerpt = video_content.get("transcript", "")[:6000]  # primeros ~6000 chars

    # Construir el system prompt con cache (DNA es siempre el mismo por usuario)
    dna_json_str = json.dumps(dna, ensure_ascii=False, indent=2)

    system_content = [
        {
            "type": "text",
            "text": f"""Eres el ghostwriter del canal. Tienes prohibido sonar como IA.
Escribe exactamente como el canal escribe, basándote en el DNA proporcionado.

DNA DEL CANAL:
{dna_json_str}

REGLAS ABSOLUTAS:
- Usa la Fórmula Óptima del canal: {formula_optima}
- Dirección energética: SIEMPRE centrípeta (todo viene HACIA el oyente)
- Activación: empieza ALTA, desciende gradualmente hacia el final
- Afirmaciones: máx 15 palabras, tiempo presente, identidad ("SOY" > "HAGO"), con metáforas visuales
- PROHIBIDO usar: {lista_negra_str}
- OBLIGATORIO incluir: validación científica (neuroplasticidad, ondas cerebrales, subconsciente)
- El hook debe generar shock o advertencia en los primeros 15 segundos
- Tono: {tono_dominante}

ESTRUCTURA OBLIGATORIA:
[0-15s] Hook certeza inevitable + shock
[15-120s] Revelación + validación científica + contraste mayoría vs. verdad
[2-4min] Preparación ritual descendente
[Cuerpo] Afirmaciones según modelo del canal
[Cierre] Reafirmación + CTA""",
            "cache_control": {"type": "ephemeral"},
        }
    ]

    analysis_str = json.dumps(analysis, ensure_ascii=False, indent=2)

    user_prompt = f"""VIDEO TENDENCIA SELECCIONADO:
Título: {video_info.get('titulo', '')}
Canal: {video_info.get('canal', '')}
Vistas: {video_info.get('vistas', 0):,}
URL: {video_info.get('url', '')}

ANÁLISIS DEL VIDEO TENDENCIA:
{analysis_str[:4000]}

EXTRACTO DE TRANSCRIPCIÓN (referencia de ideas):
{transcript_excerpt}

INSTRUCCIÓN CRÍTICA SOBRE EL VIDEO TENDENCIA:
Úsalo como MATERIA PRIMA:
1. TOMA: idea central, argumentos más poderosos, arco emocional, frases de impacto (reescríbelas con la voz del canal), estructura de capítulos como esqueleto.
2. DESCARTA: voz/tono/estilo (reemplázalos 100% con el DNA del canal), ejemplos literales, apertura y cierre originales.
3. PROPORCIONES: 60% DNA del canal + 40% contenido del video tendencia.
El guión debe sentirse como si el canal hubiera descubierto el tema por su cuenta.

Genera un guión de {duracion} minutos.
Instrucción adicional: {instruccion or 'ninguna'}

Responde con el guión completo en este formato exacto:

**[HOOK]**
(texto del hook aquí)

**[REVELACIÓN]**
(texto de la revelación aquí)

**[PREPARACIÓN]**
(texto de la preparación aquí)

**[AFIRMACIONES]**
(texto de las afirmaciones aquí)

**[CIERRE]**
(texto del cierre aquí)

---
**TÍTULOS SUGERIDOS (3 opciones):**
1. ...
2. ...
3. ..."""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=6000,
        system=system_content,
        messages=[{"role": "user", "content": user_prompt}],
    )

    return response.content[0].text.strip()
