'use client'
import { useState } from 'react'
import type { SupervisorRow, SortConfig } from '@/lib/types'
import { pct } from '@/lib/calculations'
import SortableTh from '../ui/SortableTh'

type Props = { supervisores: SupervisorRow[] }

function sortSups(arr: SupervisorRow[], key: keyof SupervisorRow, dir: 'asc' | 'desc'): SupervisorRow[] {
  return [...arr].sort((a, b) => {
    const va = (a[key] ?? 0) as number
    const vb = (b[key] ?? 0) as number
    return dir === 'asc' ? (va < vb ? -1 : 1) : (vb < va ? -1 : 1)
  })
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-slate-700 text-xs w-16 text-right">{value.toLocaleString('es-CL')}</span>
    </div>
  )
}

export default function SupervisorTab({ supervisores }: Props) {
  const [sort, setSort] = useState<SortConfig<SupervisorRow>>({ key: 'l14d', dir: 'desc' })

  const toggle = (key: keyof SupervisorRow) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  const sorted = sortSups(supervisores, sort.key, sort.dir)
  const maxL14D = Math.max(...supervisores.map(s => s.l14d), 1)

  return (
    <div className="space-y-6">
      {/* Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {sorted.map(s => {
          const wow = pct(s.l7d, s.prev_l7d)
          const cobPct = s.total_salas > 0 ? (s.salas_activas_ayer / s.total_salas) * 100 : 0
          return (
            <div key={s.supervisor} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <div className="text-base font-bold text-slate-800 truncate">{s.supervisor}</div>
                <div className="text-xs text-slate-400">{s.total_salas} salas asignadas</div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Ventas L14D</div>
                <MiniBar value={s.l14d} max={maxL14D} color="bg-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400 mb-0.5">Ayer (L7D)</div>
                  <div className="font-semibold text-slate-700">{s.l7d.toLocaleString('es-CL')}</div>
                  {wow !== null && (
                    <div className={`text-xs ${wow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {wow >= 0 ? '↑' : '↓'} {Math.abs(wow).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400 mb-0.5">Cobertura</div>
                  <div className={`font-semibold ${cobPct >= 80 ? 'text-green-600' : cobPct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {cobPct.toFixed(0)}%
                  </div>
                  <div className="text-slate-400">{s.salas_activas_ayer} activas</div>
                </div>
              </div>

              <div className="flex gap-2">
                {s.salas_quiebre > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {s.salas_quiebre} quiebre
                  </span>
                )}
                {s.salas_riesgo > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {s.salas_riesgo} riesgo
                  </span>
                )}
                {s.salas_quiebre === 0 && s.salas_riesgo === 0 && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    ✓ Sin urgencias
                  </span>
                )}
              </div>

              {(s.alertas_agencia > 0 || s.alertas_repo > 0) && (
                <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex gap-3">
                  {s.alertas_agencia > 0 && <span className="text-amber-600">{s.alertas_agencia} ag.</span>}
                  {s.alertas_repo > 0 && <span className="text-orange-600">{s.alertas_repo} repo.</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-600">Comparativa supervisores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Supervisor</th>
                <SortableTh label="Salas" sortKey="total_salas" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <SortableTh label="Activas ayer" sortKey="salas_activas_ayer" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <th className="px-4 py-3 text-right">Cobertura</th>
                <SortableTh label="L7D" sortKey="l7d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <th className="px-4 py-3 text-right">WoW%</th>
                <SortableTh label="L14D" sortKey="l14d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <SortableTh label="Quiebre" sortKey="salas_quiebre" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <SortableTh label="Riesgo" sortKey="salas_riesgo" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <SortableTh label="Al. Agencia" sortKey="alertas_agencia" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
                <SortableTh label="Al. Repo." sortKey="alertas_repo" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(s => {
                const wow = pct(s.l7d, s.prev_l7d)
                const cobPct = s.total_salas > 0 ? (s.salas_activas_ayer / s.total_salas) * 100 : 0
                return (
                  <tr key={s.supervisor} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{s.supervisor}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.total_salas}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.salas_activas_ayer}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-semibold ${cobPct >= 80 ? 'text-green-600' : cobPct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {cobPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.l7d.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-2.5 text-right">
                      {wow !== null ? (
                        <span className={`font-semibold ${wow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {wow >= 0 ? '+' : ''}{wow.toFixed(1)}%
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{s.l14d.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-2.5 text-right">
                      {s.salas_quiebre > 0
                        ? <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full text-xs">{s.salas_quiebre}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {s.salas_riesgo > 0
                        ? <span className="bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full text-xs">{s.salas_riesgo}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-amber-600">{s.alertas_agencia || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-orange-600">{s.alertas_repo || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
