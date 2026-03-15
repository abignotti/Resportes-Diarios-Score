import { createClient } from '@supabase/supabase-js'
import type { StockRow } from '@/lib/types'
import Dashboard from './components/Dashboard'

async function fetchLatestStock(): Promise<StockRow[]> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Obtener la fecha más reciente disponible
  const { data: latest } = await client
    .from('stock')
    .select('dia')
    .order('dia', { ascending: false })
    .limit(1)
    .single()

  if (!latest?.dia) return []
  const fechaMax = latest.dia

  // 2. Cargar SOLO los registros de esa fecha (paginado por si hay > 1000)
  const all: StockRow[] = []
  let offset = 0
  while (true) {
    const { data, error } = await client
      .from('stock')
      .select('*')
      .eq('dia', fechaMax)
      .range(offset, offset + 999)
      .order('local_id')
    if (error || !data?.length) break
    all.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }

  return all
}

export default async function Page() {
  const rows = await fetchLatestStock()
  return <Dashboard initialRows={rows} />
}
