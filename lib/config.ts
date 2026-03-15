// ── Grupos de cadenas (arquitectura multi-cadena)
// Agregar WALMART, TOTTUS, SMU acá cuando corresponda
export const CHAIN_GROUPS: Record<string, string[]> = {
  CENCOSUD: ['JUMBO', 'SANTA ISABEL', 'SPID'],
  // WALMART: ['LIDER', 'LIDER EXPRESS', 'ACUENTA'],
  // TOTTUS:  ['TOTTUS'],
  // SMU:     ['UNIMARC', 'OK MARKET', 'TELEMERCADOS'],
}

export const ALL_CADENAS = Object.values(CHAIN_GROUPS).flat()

// ── SKUs por cadena (catalogados/activos)
// Editar acá cuando se cataloga o descataloga un SKU en una cadena.
// null = todos los SKUs aplican (fallback genérico para cadenas nuevas)
export const CHAIN_SKUS: Record<string, number[] | null> = {
  JUMBO:         [2001113, 2030990, 2030991, 2039041, 2048972], // Solo 473ml, sin Mango ni 500ml
  'SANTA ISABEL': null, // Todos los SKUs
  SPID:           null, // Todos los SKUs
  // LIDER:       [2001113, 2030990, 2030991, 2039041, 2048972, 2034089],
  // TOTTUS:      null,
}

// ── SKUs (IDs → nombre descriptivo)
export const SKU_NOMBRES: Record<number, string> = {
  2001113: 'Zero 473ml',
  2034089: 'Mango Lata 473ml',
  2030990: 'Gorilla Lata 473ml',
  2030991: 'Original Lata 473ml',
  2039041: 'Bubblegum 473ml',
  2048972: 'Rad White 473ml',
  1776033: 'Gorilla Des 500ml',   // excepción / legacy
  2001115: 'Original 500ml',      // excepción / legacy
  2001114: 'Mango 500ml',         // excepción / legacy
}

// ── Sabores (agrupan 473ml + 500ml del mismo sabor)
// La barra de filtros muestra pills por sabor, no por SKU individual.
// Esto permite filtrar consistentemente aunque otras cadenas tengan distintas descripciones.
export const SABOR_GRUPOS: Record<string, number[]> = {
  'Gorilla':   [2030990, 1776033],  // Lata 473 + Des 500
  'Original':  [2030991, 2001115],  // Lata 473 + 500ml
  'Mango':     [2034089, 2001114],  // Lata 473 + 500ml
  'Zero':      [2001113],
  'Bubblegum': [2039041],
  'Rad White': [2048972],
}

// Dado un array de sabores seleccionados, devuelve todos los SKU IDs correspondientes
export function saboresToSkus(sabores: string[]): number[] {
  if (!sabores.length) return []
  return sabores.flatMap(s => SABOR_GRUPOS[s] ?? [])
}

// Semáforo DOH (días de stock restante)
export const DOH = { CRITICO: 2, URGENTE: 4, RIESGO: 7 }
