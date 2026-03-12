import { supabase, SKU_NOMBRES, type StockRow } from '@/lib/supabase'
import StockTable from './components/StockTable'
import KPICards from './components/KPICards'
import Filters from './components/Filters'

async function getStock(cadena?: string, supervisor?: string, soloAlertas?: boolean) {
  let query = supabase
    .from('stock')
    .select('*')
    .order('cadena')
    .order('local_id')
    .order('articulo_id')
    .limit(2000)

  if (cadena && cadena !== 'TODAS') query = query.eq('cadena', cadena)
  if (supervisor && supervisor !== 'TODOS') query = query.eq('supervisor', supervisor)
  if (soloAlertas) query = query.or('alerta_agencia.eq.1,alerta_reposicion.eq.1')

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as StockRow[]
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cadena?: string; supervisor?: string; alertas?: string }>
}) {
  const params = await searchParams
  const cadena     = params.cadena
  const supervisor = params.supervisor
  const soloAlertas = params.alertas === '1'

  const stock = await getStock(cadena, supervisor, soloAlertas)

  const totalSalas    = new Set(stock.map(r => r.local_id)).size
  const alertasAgencia = stock.filter(r => r.alerta_agencia === 1).length
  const alertasRepo    = stock.filter(r => r.alerta_reposicion === 1).length
  const sinVentaAyer   = stock.filter(r => (r.d0 ?? 0) === 0).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">⚡ Score Energy</h1>
          <p className="text-sm text-slate-500">Dashboard Cencosud — Stock & Ventas</p>
        </div>
        <div className="text-sm text-slate-400">
          Actualizado: {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </header>

      <main className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* KPIs */}
        <KPICards
          totalSalas={totalSalas}
          alertasAgencia={alertasAgencia}
          alertasRepo={alertasRepo}
          sinVentaAyer={sinVentaAyer}
        />

        {/* Filtros */}
        <Filters
          cadenaActual={cadena ?? 'TODAS'}
          supervisorActual={supervisor ?? 'TODOS'}
          soloAlertas={soloAlertas}
        />

        {/* Tabla */}
        <StockTable rows={stock} skuNombres={SKU_NOMBRES} />
      </main>
    </div>
  )
}
