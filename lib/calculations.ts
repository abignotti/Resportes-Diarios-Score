import type { StockRow, Filters, SalaRow, SkuRow, SupervisorRow, KPIs } from './types'
import { SKU_NOMBRES, DOH, CHAIN_SKUS, saboresToSkus } from './config'

// ── Helpers ────────────────────────────────────────────────────────────────────
export const n = (v: number | null | undefined): number => v ?? 0
export const pct = (a: number, b: number): number | null =>
  b === 0 ? null : ((a - b) / b) * 100

// ── DOH ────────────────────────────────────────────────────────────────────────
export function calcDOH(stock: number, l14d: number): number | null {
  const rate = l14d / 14
  if (rate <= 0) return null
  return Math.max(0, stock) / rate
}

export function dohLabel(doh: number | null): string {
  if (doh === null) return '—'
  if (doh === 0 || doh < 0) return 'QUIEBRE'
  return doh.toFixed(1) + 'd'
}

export function dohClass(doh: number | null): string {
  if (doh === null) return 'text-slate-400'
  if (doh <= 0) return 'text-white bg-red-600 font-bold px-1 rounded'
  if (doh < DOH.CRITICO) return 'text-red-600 font-bold'
  if (doh < DOH.URGENTE) return 'text-orange-500 font-semibold'
  if (doh < DOH.RIESGO) return 'text-yellow-600'
  return 'text-green-600'
}

// ── Velocidad / tendencia ──────────────────────────────────────────────────────
export function velocityIcon(velocity: number | null): { icon: string; cls: string; label: string } {
  if (velocity === null) return { icon: '—', cls: 'text-slate-400', label: 'Sin datos' }
  if (velocity > 1.15) return { icon: '↑', cls: 'text-green-600 font-bold', label: 'Acelerando' }
  if (velocity < 0.85) return { icon: '↓', cls: 'text-red-500 font-bold', label: 'Desacelerando' }
  return { icon: '→', cls: 'text-slate-500', label: 'Estable' }
}

// ── Filtros ────────────────────────────────────────────────────────────────────
export function applyFilters(rows: StockRow[], f: Filters): StockRow[] {
  // Pre-calcular SKU IDs de los sabores seleccionados (vacío = todos)
  const skuIds = f.sabores.length ? saboresToSkus(f.sabores) : []

  return rows.filter(r => {
    // 1. Filtro de cadena
    if (f.cadenas.length && !f.cadenas.includes(r.cadena)) return false

    // 2. Solo mostrar SKUs catalogados para esta cadena
    const catalogados = CHAIN_SKUS[r.cadena]
    if (catalogados && !catalogados.includes(r.articulo_id)) return false

    // 3. Filtro de supervisor
    if (f.supervisores.length) {
      const sup = r.supervisor?.toUpperCase().trim() ?? ''
      if (!f.supervisores.includes(sup)) return false
    }

    // 4. Búsqueda de sala por ID o nombre
    if (f.sala) {
      const q = f.sala.toLowerCase()
      if (!r.local_id.toLowerCase().includes(q) && !(r.local_desc ?? '').toLowerCase().includes(q)) return false
    }

    // 5. Filtro de sabor (expandido a SKU IDs)
    if (skuIds.length && !skuIds.includes(r.articulo_id)) return false

    // 6. Filtros rápidos
    if (f.soloQuiebre && !(n(r.stock_disponibilidad) <= 0 && n(r.l14d) > 0)) return false
    if (f.soloAlertas && r.alerta_agencia !== 1 && r.alerta_reposicion !== 1) return false

    return true
  })
}

// ── KPIs ejecutivos ────────────────────────────────────────────────────────────
export function calcKPIs(rows: StockRow[]): KPIs {
  const salas = new Set(rows.map(r => r.local_id))
  const salasActivas = new Set(rows.filter(r => n(r.d0) > 0).map(r => r.local_id))

  const venta_ayer = rows.reduce((s, r) => s + n(r.d0), 0)
  const venta_ayer_prev = rows.reduce((s, r) => s + n(r.d7), 0)
  const l7d = rows.reduce((s, r) => s + n(r.l7d), 0)
  const l14d = rows.reduce((s, r) => s + n(r.l14d), 0)
  const prev_l7d = l14d - l7d

  const quiebreRows = rows.filter(r => n(r.stock_disponibilidad) <= 0 && n(r.l14d) > 0)
  const salasQuiebre = new Set(quiebreRows.map(r => r.local_id))

  const perdida = quiebreRows.reduce((s, r) => s + n(r.l14d) / 14, 0)

  return {
    total_salas: salas.size,
    salas_activas_ayer: salasActivas.size,
    cobertura_pct: salas.size > 0 ? (salasActivas.size / salas.size) * 100 : 0,
    venta_ayer,
    venta_ayer_prev,
    l7d,
    prev_l7d,
    salas_quiebre: salasQuiebre.size,
    skus_quiebre_count: quiebreRows.length,
    perdida_diaria_est: Math.round(perdida),
  }
}

// ── Salas ──────────────────────────────────────────────────────────────────────
export function calcSalas(rows: StockRow[]): SalaRow[] {
  const map = new Map<string, SalaRow>()

  for (const r of rows) {
    if (!map.has(r.local_id)) {
      map.set(r.local_id, {
        local_id: r.local_id,
        local_desc: r.local_desc ?? r.local_id,
        cadena: r.cadena,
        supervisor: r.supervisor?.trim() || 'Sin supervisor',
        region: r.region ?? '—',
        total_stock: 0, total_transito: 0, venta_ayer: 0,
        l7d: 0, l14d: 0, prev_l7d: 0, doh: null,
        skus_quiebre: 0, skus_riesgo: 0, rows: [],
      })
    }
    const s = map.get(r.local_id)!
    s.total_stock   += n(r.stock_disponibilidad)
    s.total_transito += n(r.stock_transito)
    s.venta_ayer    += n(r.d0)
    s.l7d           += n(r.l7d)
    s.l14d          += n(r.l14d)
    s.prev_l7d      += n(r.l14d) - n(r.l7d)
    if (n(r.stock_disponibilidad) <= 0 && n(r.l14d) > 0) s.skus_quiebre++
    const doh = calcDOH(n(r.stock_disponibilidad), n(r.l14d))
    if (doh !== null && doh > 0 && doh < DOH.URGENTE) s.skus_riesgo++
    s.rows.push(r)
  }

  for (const s of map.values()) {
    s.doh = calcDOH(s.total_stock, s.l14d)
  }

  return Array.from(map.values())
}

// ── SKUs ───────────────────────────────────────────────────────────────────────
export function calcSkus(rows: StockRow[]): SkuRow[] {
  const totalL14D = rows.reduce((s, r) => s + n(r.l14d), 0)
  const map = new Map<number, SkuRow>()

  for (const r of rows) {
    if (!map.has(r.articulo_id)) {
      map.set(r.articulo_id, {
        articulo_id: r.articulo_id,
        nombre: SKU_NOMBRES[r.articulo_id] ?? r.articulo_desc ?? String(r.articulo_id),
        l14d: 0, market_share: 0, l7d: 0, prev_l7d: 0, venta_ayer: 0,
        velocity: null, salas_activas: 0, salas_quiebre: 0, doh_avg: null,
      })
    }
    const s = map.get(r.articulo_id)!
    s.l14d      += n(r.l14d)
    s.l7d       += n(r.l7d)
    s.prev_l7d  += n(r.l14d) - n(r.l7d)
    s.venta_ayer += n(r.d0)
    if (n(r.l14d) > 0) s.salas_activas++
    if (n(r.stock_disponibilidad) <= 0 && n(r.l14d) > 0) s.salas_quiebre++
  }

  const skus = Array.from(map.values())
  for (const s of skus) {
    s.market_share = totalL14D > 0 ? (s.l14d / totalL14D) * 100 : 0
    s.velocity = s.prev_l7d > 0 ? (s.l7d / 7) / (s.prev_l7d / 7) : null
    const dohVals = rows
      .filter(r => r.articulo_id === s.articulo_id && n(r.l14d) > 0)
      .map(r => calcDOH(n(r.stock_disponibilidad), n(r.l14d)))
      .filter((d): d is number => d !== null)
    s.doh_avg = dohVals.length ? dohVals.reduce((a, b) => a + b, 0) / dohVals.length : null
  }

  return skus.sort((a, b) => b.l14d - a.l14d)
}

// ── Supervisores ───────────────────────────────────────────────────────────────
export function calcSupervisores(rows: StockRow[]): SupervisorRow[] {
  const map = new Map<string, SupervisorRow & { _salas: Set<string>; _activas: Set<string>; _quiebre: Set<string>; _riesgo: Set<string> }>()

  for (const r of rows) {
    const sup = r.supervisor?.trim().toUpperCase() || 'SIN SUPERVISOR'
    if (!map.has(sup)) {
      map.set(sup, {
        supervisor: sup, total_salas: 0, salas_activas_ayer: 0,
        salas_quiebre: 0, salas_riesgo: 0, l7d: 0, l14d: 0, prev_l7d: 0,
        alertas_agencia: 0, alertas_repo: 0,
        _salas: new Set(), _activas: new Set(), _quiebre: new Set(), _riesgo: new Set(),
      })
    }
    const s = map.get(sup)!
    s.l7d  += n(r.l7d)
    s.l14d += n(r.l14d)
    s.prev_l7d += n(r.l14d) - n(r.l7d)
    if (r.alerta_agencia   === 1) s.alertas_agencia++
    if (r.alerta_reposicion === 1) s.alertas_repo++
    s._salas.add(r.local_id)
    if (n(r.d0) > 0) s._activas.add(r.local_id)
    if (n(r.stock_disponibilidad) <= 0 && n(r.l14d) > 0) s._quiebre.add(r.local_id)
    const doh = calcDOH(n(r.stock_disponibilidad), n(r.l14d))
    if (doh !== null && doh > 0 && doh < DOH.URGENTE) s._riesgo.add(r.local_id)
  }

  return Array.from(map.values()).map(s => ({
    ...s,
    total_salas: s._salas.size,
    salas_activas_ayer: s._activas.size,
    salas_quiebre: s._quiebre.size,
    salas_riesgo: s._riesgo.size,
  })).sort((a, b) => b.l14d - a.l14d)
}

// ── Urgencias ─────────────────────────────────────────────────────────────────
export function getUrgencias(rows: StockRow[]) {
  const quiebre = rows
    .filter(r => n(r.stock_disponibilidad) <= 0 && n(r.l14d) > 0)
    .sort((a, b) => n(b.l14d) / 14 - n(a.l14d) / 14)

  const riesgo = rows
    .filter(r => {
      const doh = calcDOH(n(r.stock_disponibilidad), n(r.l14d))
      return doh !== null && doh > 0 && doh < DOH.URGENTE && n(r.l14d) > 0
    })
    .sort((a, b) => {
      const da = calcDOH(n(a.stock_disponibilidad), n(a.l14d)) ?? 99
      const db = calcDOH(n(b.stock_disponibilidad), n(b.l14d)) ?? 99
      return da - db
    })

  // D0=0, stock>0, l7d>0 → vendía la semana pasada, tiene stock, no vendió ayer
  const silenciosa = rows
    .filter(r => n(r.d0) === 0 && n(r.stock_disponibilidad) > 0 && n(r.l7d) > 0)
    .sort((a, b) => n(b.l7d) - n(a.l7d))

  return { quiebre, riesgo, silenciosa }
}

// ── Sorting genérico ──────────────────────────────────────────────────────────
export function sortRows<T>(arr: T[], key: keyof T, dir: 'asc' | 'desc'): T[] {
  return [...arr].sort((a, b) => {
    const va = a[key] ?? 0
    const vb = b[key] ?? 0
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return dir === 'asc' ? cmp : -cmp
  })
}
