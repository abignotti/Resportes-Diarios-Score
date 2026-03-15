// ── Grupos de cadenas (arquitectura multi-cadena)
export const CHAIN_GROUPS: Record<string, string[]> = {
  CENCOSUD: ['JUMBO', 'SANTA ISABEL', 'SPID'],
  WALMART:  ['LIDER', 'LIDER EXPRESS', 'ACUENTA', 'EKONO', 'CENTRAL MAYORISTA'],
  // TOTTUS:  ['TOTTUS'],
  // SMU:     ['UNIMARC', 'OK MARKET', 'TELEMERCADOS'],
}

export const ALL_CADENAS = Object.values(CHAIN_GROUPS).flat()

// ── SKUs por cadena (catalogados/activos)
// null = todos los SKUs aplican (fallback genérico para cadenas nuevas)
export const CHAIN_SKUS: Record<string, number[] | null> = {
  // Cencosud
  JUMBO:              [2001113, 2030990, 2030991, 2039041, 2048972], // Solo 473ml, sin Mango
  'SANTA ISABEL':     null,
  SPID:               null,
  // Walmart (Consumer IDs canónicos)
  LIDER:              null,
  'LIDER EXPRESS':    null,
  ACUENTA:            null,
  EKONO:              null,
  'CENTRAL MAYORISTA': null,
}

// ── SKUs (IDs → nombre descriptivo) — incluye Cencosud + Walmart
export const SKU_NOMBRES: Record<number, string> = {
  // Cencosud IDs
  2001113:   'Zero 473ml',
  2034089:   'Mango Lata 473ml',
  2030990:   'Gorilla Lata 473ml',
  2030991:   'Original Lata 473ml',
  2039041:   'Bubblegum 473ml',
  2048972:   'Rad White 473ml',
  1776033:   'Gorilla Des 500ml',
  2001115:   'Original 500ml',
  2001114:   'Mango 500ml',
  // Walmart IDs (Consumer ID canónico por sabor)
  92712338:  'Gorilla',
  220198871: 'Original',
  220198872: 'Mango',
  220198873: 'Zero',
  224015661: 'Bubblegum',
  226270474: 'Rad White',
  224015660: 'Fruit Punch',
  223158027: 'Con Gas',
  223158028: 'Sin Gas',
}

// ── Sabores (agrupan IDs de Cencosud + Walmart del mismo sabor)
// La barra de filtros muestra pills por sabor, no por SKU individual.
export const SABOR_GRUPOS: Record<string, number[]> = {
  'Gorilla':     [2030990, 1776033, 92712338],
  'Original':    [2030991, 2001115, 220198871],
  'Mango':       [2034089, 2001114, 220198872],
  'Zero':        [2001113, 220198873],
  'Bubblegum':   [2039041, 224015661],
  'Rad White':   [2048972, 226270474],
  'Fruit Punch': [224015660],
}

// Sabores secundarios (aguas) — se muestran en datos pero no como filtro principal
export const SABOR_SECUNDARIOS: Record<string, number[]> = {
  'Con Gas': [223158027],
  'Sin Gas': [223158028],
}

// Dado un array de sabores seleccionados, devuelve todos los SKU IDs correspondientes
export function saboresToSkus(sabores: string[]): number[] {
  if (!sabores.length) return []
  const all = { ...SABOR_GRUPOS, ...SABOR_SECUNDARIOS }
  return sabores.flatMap(s => all[s] ?? [])
}

// Semáforo DOH (días de stock restante)
export const DOH = { CRITICO: 2, URGENTE: 4, RIESGO: 7 }
