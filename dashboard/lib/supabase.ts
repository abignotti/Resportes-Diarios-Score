import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export type StockRow = {
  id: number
  dia: string
  cadena: string
  local_id: string
  local_desc: string
  articulo_id: number
  articulo_desc: string
  stock_disponibilidad: number | null
  stock_lu: number | null
  stock_transito: number | null
  forecast: number | null
  l7d: number | null
  l14d: number | null
  d0: number | null
  alerta_agencia: number
  alerta_reposicion: number
  region: string | null
  supervisor: string | null
  atencion: string | null
}

export type MaestroRow = {
  local_id: string
  cadena: string
  store_name: string
  comuna: string | null
  encargado: string | null
}

export const SKU_NOMBRES: Record<number, string> = {
  2001113: 'Zero 473ml',
  2034089: 'Mango Lata 473ml',
  2030990: 'Gorilla Lata 473ml',
  2030991: 'Original Lata 473ml',
  2039041: 'Bubblegum 473ml',
  2048972: 'Rad White 473ml',
  1776033: 'Gorilla Des 500ml',
  2001115: 'Original 500ml',
  2001114: 'Mango 500ml',
}
