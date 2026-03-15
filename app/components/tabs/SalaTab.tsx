'use client'
import { useState, Fragment } from 'react'
import type { SalaRow, SortConfig } from '@/lib/types'
import { calcDOH, dohLabel, dohClass, velocityIcon, pct, n } from '@/lib/calculations'
import SortableTh from '../ui/SortableTh'

type Props = { salas: SalaRow[] }

function sortSalas(arr: SalaRow[], key: keyof SalaRow, dir: 'asc' | 'desc'): SalaRow[] {
  return [...arr].sort((a, b) => {
    const va = (a[key] ?? 0) as number
    const vb = (b[key] ?? 0) as number
    if (typeof va === 'string' || typeof vb === 'string') {
      return dir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    }
    return dir === 'asc' ? (va < vb ? -1 : 1) : (vb < va ? -1 : 1)
  })
}

function SkuDetail({ rows }: { rows: SalaRow['rows'] }) {
  const totalL14D = rows.reduce((s, r) => s + n(r.l14d), 0)
  return (
    <tr>
      <td colSpan={10} className="px-0 py-0">
        <div className="bg-slate-50 border-t border-b border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wide border-b border-slate-200">
                <th className="pl-12 pr-4 py-2 text-left w-64">SKU</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right">Tránsito</th>
                <th className="px-4 py-2 text-right">Ayer</th>
                <th className="px-4 py-2 text-right">L7D</th>
                <th className="px-4 py-2 text-right">L14D</th>
                <th className="px-4 py-2 text-right">Share</th>
                <th className="px-4 py-2 text-right">DOH</th>
                <th className="px-4 py-2 text-center">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.filter(r => n(r.l14d) > 0 || n(r.stock_disponibilidad) > 0).map((r, i) => {
                const doh = calcDOH(n(r.stock_disponibilidad), n(r.l14d))
                const vel = n(r.l14d) > 0 ? (n(r.l7d) / 7) / ((n(r.l14d) - n(r.l7d)) / 7) : null
                const { icon: arr, cls: arrCls } = velocityIcon(vel)
                const share = totalL14D > 0 ? (n(r.l14d) / totalL14D) * 100 : 0
                return (
                  <tr key={i} className="hover:bg-white">
                    <td className="pl-12 pr-4 py-1.5 text-slate-700 font-medium">{r.articulo_desc ?? r.articulo_id}</td>
                    <td className="px-4 py-1.5 text-right font-mono">
                      <span className={n(r.stock_disponibilidad) <= 0 && n(r.l14d) > 0
                        ? 'text-white bg-red-600 font-bold px-1 rounded'
                        : 'text-slate-700'}>
                        {n(r.stock_disponibilidad)}
                      </span>
                    </td>
                    <td className="px-4 py-1.5 text-right font-mono text-slate-500">{n(r.stock_transito)}</td>
                    <td className="px-4 py-1.5 text-right font-mono text-slate-600">{n(r.d0)}</td>
                    <td className="px-4 py-1.5 text-right font-mono">{n(r.l7d)}</td>
                    <td className="px-4 py-1.5 text-right font-mono">{n(r.l14d)}</td>
                    <td className="px-4 py-1.5 text-right text-slate-500">{share.toFixed(1)}%</td>
                    <td className="px-4 py-1.5 text-right">
                      <span className={dohClass(doh)}>{dohLabel(doh)}</span>
                    </td>
                    <td className={`px-4 py-1.5 text-center ${arrCls}`}>{arr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

export default function SalaTab({ salas }: Props) {
  const [sort, setSort] = useState<SortConfig<SalaRow>>({ key: 'l14d', dir: 'desc' })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (key: keyof SalaRow) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const sorted = sortSalas(salas, sort.key, sort.dir)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
        {salas.length} salas · Haz clic en una fila para ver el desglose por SKU
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left w-8" />
              <th className="px-4 py-3 text-left">Sala</th>
              <th className="px-4 py-3 text-left">Cadena</th>
              <th className="px-4 py-3 text-left">Supervisor</th>
              <SortableTh label="Stock" sortKey="total_stock" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="Tránsito" sortKey="total_transito" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="Ayer" sortKey="venta_ayer" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="L7D" sortKey="l7d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="L14D" sortKey="l14d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <th className="px-4 py-3 text-right">DOH</th>
              <SortableTh label="Quiebre" sortKey="skus_quiebre" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <th className="px-4 py-3 text-right">Tendencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map(s => {
              const isOpen = expanded.has(s.local_id)
              const vel = s.prev_l7d > 0 ? (s.l7d / 7) / (s.prev_l7d / 7) : null
              const { icon: arr, cls: arrCls } = velocityIcon(vel)
              const wowPct = pct(s.l7d, s.prev_l7d)

              return (
                <Fragment key={s.local_id}>
                  <tr
                    onClick={() => toggleExpand(s.local_id)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-slate-400 text-center select-none">
                      {isOpen ? '▾' : '▸'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{s.local_desc}</div>
                      <div className="text-xs text-slate-400">{s.local_id}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{s.cadena}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{s.supervisor}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.total_stock.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-400">{s.total_transito.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.venta_ayer.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      <div>{s.l7d.toLocaleString('es-CL')}</div>
                      {wowPct !== null && (
                        <div className={`text-xs ${wowPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {wowPct >= 0 ? '↑' : '↓'} {Math.abs(wowPct).toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.l14d.toLocaleString('es-CL')}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={dohClass(s.doh)}>{dohLabel(s.doh)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {s.skus_quiebre > 0 ? (
                        <span className="inline-block bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full text-xs">
                          {s.skus_quiebre}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-center text-lg ${arrCls}`}>{arr}</td>
                  </tr>
                  {isOpen && <SkuDetail rows={s.rows} />}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
