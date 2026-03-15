'use client'
import type { KPIs, SkuRow } from '@/lib/types'
import { pct } from '@/lib/calculations'
import StatCard from '../ui/StatCard'

type Props = { kpis: KPIs; skus: SkuRow[] }

export default function ResumenTab({ kpis, skus }: Props) {
  const cambioAyer = pct(kpis.venta_ayer, kpis.venta_ayer_prev)
  const cambioL7D  = pct(kpis.l7d, kpis.prev_l7d)
  const totalL14D  = skus.reduce((s, k) => s + k.l14d, 0)

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Ventas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Latas vendidas ayer"
            value={kpis.venta_ayer.toLocaleString('es-CL')}
            change={cambioAyer}
            sub="vs mismo día sem. ant."
            color="blue"
            large
          />
          <StatCard
            label="Ventas últimos 7 días"
            value={kpis.l7d.toLocaleString('es-CL')}
            change={cambioL7D}
            sub="vs 7 días anteriores"
            color="blue"
          />
          <StatCard
            label="Ventas últimos 14 días"
            value={(kpis.l7d + kpis.prev_l7d).toLocaleString('es-CL')}
            color="slate"
          />
          <StatCard
            label="Promedio diario (L14D)"
            value={((kpis.l7d + kpis.prev_l7d) / 14).toFixed(0)}
            sub="latas/día"
            color="slate"
          />
        </div>
      </div>

      {/* KPIs de cobertura */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Cobertura & Stock</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Cobertura ayer"
            value={`${kpis.cobertura_pct.toFixed(1)}%`}
            sub={`${kpis.salas_activas_ayer} de ${kpis.total_salas} salas`}
            color={kpis.cobertura_pct >= 80 ? 'green' : kpis.cobertura_pct >= 60 ? 'yellow' : 'red'}
          />
          <StatCard
            label="Salas con quiebre"
            value={kpis.salas_quiebre}
            sub={`${((kpis.salas_quiebre / kpis.total_salas) * 100).toFixed(1)}% del total`}
            color={kpis.salas_quiebre === 0 ? 'green' : kpis.salas_quiebre < 10 ? 'yellow' : 'red'}
          />
          <StatCard
            label="Registros en quiebre"
            value={kpis.skus_quiebre_count}
            sub="combinaciones sala×SKU"
            color="orange"
          />
          <StatCard
            label="Pérdida est. diaria"
            value={kpis.perdida_diaria_est.toLocaleString('es-CL')}
            sub="latas/día por quiebre"
            color="red"
          />
        </div>
      </div>

      {/* Market share por SKU */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Market Share por SKU — últimos 14 días
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Sabor</th>
                <th className="px-4 py-3 text-right">Latas L14D</th>
                <th className="px-4 py-3 text-left w-48">Share</th>
                <th className="px-4 py-3 text-right">Latas ayer</th>
                <th className="px-4 py-3 text-right">L7D</th>
                <th className="px-4 py-3 text-right">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {skus.filter(s => s.l14d > 0).map(s => {
                const vel = s.velocity
                const arr = vel === null ? '—'
                  : vel > 1.15 ? '↑' : vel < 0.85 ? '↓' : '→'
                const arrCls = vel === null ? 'text-slate-400'
                  : vel > 1.15 ? 'text-green-600 font-bold' : vel < 0.85 ? 'text-red-500 font-bold' : 'text-slate-500'
                return (
                  <tr key={s.articulo_id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{s.nombre}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.l14d.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, s.market_share)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 w-10 text-right">
                          {s.market_share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-600">{s.venta_ayer.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-600">{s.l7d.toLocaleString('es-CL')}</td>
                    <td className={`px-4 py-2.5 text-center text-lg ${arrCls}`}>{arr}</td>
                  </tr>
                )
              })}
              {/* Total */}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-2.5 text-slate-700">TOTAL</td>
                <td className="px-4 py-2.5 text-right font-mono">{totalL14D.toLocaleString('es-CL')}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400 text-center">100%</td>
                <td className="px-4 py-2.5 text-right font-mono">{kpis.venta_ayer.toLocaleString('es-CL')}</td>
                <td className="px-4 py-2.5 text-right font-mono">{kpis.l7d.toLocaleString('es-CL')}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
