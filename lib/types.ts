export type StockRow = {
  id: number
  dia: string
  cadena: string
  local_id: string
  local_desc: string | null
  articulo_id: number
  articulo_desc: string | null
  stock_disponibilidad: number | null
  stock_lu: number | null
  stock_transito: number | null
  forecast: number | null
  cubicaje: number | null
  min_exhibicion: number | null
  d0: number | null; d1: number | null; d2: number | null; d3: number | null
  d4: number | null; d5: number | null; d6: number | null; d7: number | null
  d8: number | null; d9: number | null; d10: number | null; d11: number | null
  d12: number | null; d13: number | null
  l7d: number | null
  l14d: number | null
  alerta_agencia: number
  alerta_reposicion: number
  region: string | null
  supervisor: string | null
  atencion: string | null
  incentivo: string | null
}

export type Filters = {
  cadenas: string[]       // vacío = todas
  supervisores: string[]  // vacío = todos
  sala: string            // búsqueda por ID o nombre
  sabores: string[]       // vacío = todos los sabores (Gorilla, Original, Mango, Zero, Bubblegum, Rad White)
  soloQuiebre: boolean
  soloAlertas: boolean
}

export type SalaRow = {
  local_id: string
  local_desc: string
  cadena: string
  supervisor: string
  region: string
  total_stock: number
  total_transito: number
  venta_ayer: number
  l7d: number
  l14d: number
  prev_l7d: number        // l14d - l7d = "semana anterior"
  doh: number | null      // total_stock / (l14d/14)
  skus_quiebre: number
  skus_riesgo: number
  rows: StockRow[]
}

export type SkuRow = {
  articulo_id: number
  nombre: string
  l14d: number
  market_share: number    // % del total L14D
  l7d: number
  prev_l7d: number
  venta_ayer: number
  velocity: number | null // (l7d/7) / (prev_l7d/7)
  salas_activas: number
  salas_quiebre: number
  doh_avg: number | null
}

export type SupervisorRow = {
  supervisor: string
  total_salas: number
  salas_activas_ayer: number
  salas_quiebre: number
  salas_riesgo: number
  l7d: number
  l14d: number
  prev_l7d: number
  alertas_agencia: number
  alertas_repo: number
}

export type KPIs = {
  total_salas: number
  salas_activas_ayer: number
  cobertura_pct: number
  venta_ayer: number
  venta_ayer_prev: number   // D7 del mismo día hace 1 semana
  l7d: number
  prev_l7d: number
  salas_quiebre: number
  skus_quiebre_count: number
  perdida_diaria_est: number
}

export type SortConfig<T = Record<string, unknown>> = { key: keyof T & string; dir: 'asc' | 'desc' }
