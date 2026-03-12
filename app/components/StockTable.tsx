import type { StockRow } from '@/lib/supabase'

type Props = {
  rows: StockRow[]
  skuNombres: Record<number, string>
}

function Badge({ value, label }: { value: number; label: string }) {
  if (!value) return null
  return (
    <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      {label}
    </span>
  )
}

function fmt(n: number | null) {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('es-CL')
}

export default function StockTable({ rows, skuNombres }: Props) {
  if (!rows.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        No hay datos para los filtros seleccionados.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {rows.length.toLocaleString('es-CL')} registros
        </span>
        <span className="text-xs text-slate-400">
          {rows[0]?.dia ? `Día: ${rows[0].dia}` : ''}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Cadena</th>
              <th className="px-4 py-3 text-left">Sala</th>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Tránsito</th>
              <th className="px-4 py-3 text-right">D0</th>
              <th className="px-4 py-3 text-right">L7D</th>
              <th className="px-4 py-3 text-right">L14D</th>
              <th className="px-4 py-3 text-right">Forecast</th>
              <th className="px-4 py-3 text-left">Supervisor</th>
              <th className="px-4 py-3 text-left">Alertas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => {
              const tieneAlerta = r.alerta_agencia === 1 || r.alerta_reposicion === 1
              return (
                <tr
                  key={r.id}
                  className={`hover:bg-slate-50 transition-colors ${tieneAlerta ? 'bg-red-50/40' : ''}`}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-700">{r.cadena}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-800">{r.local_id}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[180px]">{r.local_desc}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 max-w-[160px] truncate">
                    {skuNombres[r.articulo_id] ?? r.articulo_desc}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${
                    (r.stock_disponibilidad ?? 0) <= 0 ? 'text-red-600' : 'text-slate-800'
                  }`}>
                    {fmt(r.stock_disponibilidad)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-blue-600">
                    {fmt(r.stock_transito)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                    {fmt(r.d0)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                    {fmt(r.l7d)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                    {fmt(r.l14d)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-purple-600">
                    {fmt(r.forecast)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">
                    {r.supervisor || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      <Badge value={r.alerta_agencia}    label="Agencia" />
                      <Badge value={r.alerta_reposicion} label="Repos." />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
