'use client'
import { useState } from 'react'
import type { SkuRow, SortConfig } from '@/lib/types'
import { dohLabel, dohClass, velocityIcon, pct } from '@/lib/calculations'
import SortableTh from '../ui/SortableTh'

type Props = { skus: SkuRow[] }

function sortSkus(arr: SkuRow[], key: keyof SkuRow, dir: 'asc' | 'desc'): SkuRow[] {
  return [...arr].sort((a, b) => {
    const va = (a[key] ?? 0) as number
    const vb = (b[key] ?? 0) as number
    return dir === 'asc' ? (va < vb ? -1 : 1) : (vb < va ? -1 : 1)
  })
}

export default function SkuTab({ skus }: Props) {
  const [sort, setSort] = useState<SortConfig<SkuRow>>({ key: 'l14d', dir: 'desc' })

  const toggle = (key: keyof SkuRow) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  const sorted = sortSkus(skus, sort.key, sort.dir)
  const totalL14D = skus.reduce((s, k) => s + k.l14d, 0)

  // Color scale for market share bars
  const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
    'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-teal-500',
  ]

  return (
    <div className="space-y-6">
      {/* Visual market share breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Distribución market share — últimos 14 días
        </h2>
        <div className="flex h-8 rounded-full overflow-hidden gap-px">
          {sorted.filter(s => s.l14d > 0).map((s, i) => (
            <div
              key={s.articulo_id}
              className={`${colors[i % colors.length]} transition-all`}
              style={{ width: `${s.market_share}%` }}
              title={`${s.nombre}: ${s.market_share.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {sorted.filter(s => s.l14d > 0).map((s, i) => (
            <div key={s.articulo_id} className="flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${colors[i % colors.length]}`} />
              <span className="text-xs text-slate-600">{s.nombre}</span>
              <span className="text-xs font-semibold text-slate-800">{s.market_share.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Sabor / SKU</th>
                <SortableTh label="L14D" sortKey="l14d" current={sort} onSort={toggle} className="px-4 py-3 text-left w-56" />
                <SortableTh label="L7D" sortKey="l7d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <SortableTh label="Ayer" sortKey="venta_ayer" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <th className="px-4 py-3 text-right">WoW%</th>
                <th className="px-4 py-3 text-center">Tendencia</th>
                <SortableTh label="Salas activas" sortKey="salas_activas" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <SortableTh label="En quiebre" sortKey="salas_quiebre" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <SortableTh label="DOH prom." sortKey="doh_avg" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((s, i) => {
                const { icon: arr, cls: arrCls, label: arrLabel } = velocityIcon(s.velocity)
                const wow = pct(s.l7d, s.prev_l7d)
                const quiebrePct = s.salas_activas > 0 ? (s.salas_quiebre / s.salas_activas) * 100 : 0

                return (
                  <tr key={s.articulo_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{s.nombre}</div>
                      <div className="text-xs text-slate-400">{s.articulo_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2.5 min-w-24">
                          <div
                            className={`${colors[i % colors.length]} h-2.5 rounded-full`}
                            style={{ width: `${Math.min(100, s.market_share)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">
                          {s.market_share.toFixed(1)}%
                        </span>
                        <span className="font-mono text-slate-600 text-xs w-20 text-right">
                          {s.l14d.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {s.l7d.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {s.venta_ayer.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {wow !== null ? (
                        <span className={`text-sm font-semibold ${wow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {wow >= 0 ? '+' : ''}{wow.toFixed(1)}%
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-4 py-3 text-center text-lg ${arrCls}`} title={arrLabel}>{arr}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{s.salas_activas}</td>
                    <td className="px-4 py-3 text-right">
                      {s.salas_quiebre > 0 ? (
                        <div>
                          <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full text-xs">
                            {s.salas_quiebre}
                          </span>
                          <span className="text-xs text-red-400 ml-1">{quiebrePct.toFixed(0)}%</span>
                        </div>
                      ) : (
                        <span className="text-green-500 font-semibold text-xs">✓ OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={dohClass(s.doh_avg)}>{dohLabel(s.doh_avg)}</span>
                    </td>
                  </tr>
                )
              })}

              {/* Total row */}
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="px-4 py-3 text-slate-700">TOTAL</td>
                <td className="px-4 py-3">
                  <span className="font-mono">{totalL14D.toLocaleString('es-CL')}</span>
                  <span className="text-xs text-slate-400 ml-2">latas</span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {skus.reduce((s, k) => s + k.l7d, 0).toLocaleString('es-CL')}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {skus.reduce((s, k) => s + k.venta_ayer, 0).toLocaleString('es-CL')}
                </td>
                <td colSpan={5} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
