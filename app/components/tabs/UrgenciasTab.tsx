'use client'
import { useState } from 'react'
import type { StockRow } from '@/lib/types'
import { calcDOH, dohLabel, dohClass, n } from '@/lib/calculations'
import SortableTh from '../ui/SortableTh'
import type { SortConfig } from '@/lib/types'

type Props = { quiebre: StockRow[]; riesgo: StockRow[]; silenciosa: StockRow[] }

type SubTab = 'quiebre' | 'riesgo' | 'silenciosa'

function sortRows<T>(arr: T[], key: keyof T, dir: 'asc' | 'desc'): T[] {
  return [...arr].sort((a, b) => {
    const va = (a[key] ?? 0) as number
    const vb = (b[key] ?? 0) as number
    return dir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0)
  })
}

function QuiebreTable({ rows }: { rows: StockRow[] }) {
  const [sort, setSort] = useState<SortConfig<StockRow>>({ key: 'l14d', dir: 'desc' })

  const toggle = (key: keyof StockRow) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  const sorted = sortRows(rows, sort.key, sort.dir)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm font-semibold text-red-700">{rows.length} registros en quiebre</span>
        <span className="text-xs text-red-500 ml-1">(stock ≤ 0 con ventas recientes)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Sala</th>
              <th className="px-4 py-3 text-left">Cadena</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Supervisor</th>
              <SortableTh label="Stock" sortKey="stock_disponibilidad" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="Tránsito" sortKey="stock_transito" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="L14D" sortKey="l14d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="Tasa/día" sortKey="l14d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <th className="px-4 py-3 text-right">Pérd. est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((r, i) => {
              const tasa = n(r.l14d) / 14
              return (
                <tr key={i} className="hover:bg-red-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <span className="text-xs text-slate-400 mr-1">{r.local_id}</span>
                    {r.local_desc ?? r.local_id}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{r.cadena}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.articulo_desc ?? r.articulo_id}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{r.supervisor?.trim() || '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-white bg-red-600 font-bold px-1.5 py-0.5 rounded text-xs">
                      {n(r.stock_disponibilidad)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{n(r.stock_transito)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{n(r.l14d).toLocaleString('es-CL')}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-600">{tasa.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600 font-semibold">
                    {tasa.toFixed(1)}
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

function RiesgoTable({ rows }: { rows: StockRow[] }) {
  const [sort, setSort] = useState<SortConfig<StockRow>>({ key: 'stock_disponibilidad', dir: 'asc' })

  const toggle = (key: keyof StockRow) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  const withDoh = rows.map(r => ({
    ...r,
    _doh: calcDOH(n(r.stock_disponibilidad), n(r.l14d)) ?? 99,
  }))

  const sorted = sort.key === 'stock_disponibilidad'
    ? [...withDoh].sort((a, b) => sort.dir === 'asc' ? a._doh - b._doh : b._doh - a._doh)
    : sortRows(withDoh, sort.key as keyof typeof withDoh[0], sort.dir)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
        <span className="text-sm font-semibold text-orange-700">{rows.length} registros en riesgo</span>
        <span className="text-xs text-orange-500 ml-1">(0 &lt; DOH &lt; 4 días)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Sala</th>
              <th className="px-4 py-3 text-left">Cadena</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Supervisor</th>
              <SortableTh label="DOH" sortKey="stock_disponibilidad" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="Stock" sortKey="stock_disponibilidad" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="Tránsito" sortKey="stock_transito" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="L14D" sortKey="l14d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <th className="px-4 py-3 text-right">Tasa/día</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((r, i) => {
              const doh = calcDOH(n(r.stock_disponibilidad), n(r.l14d))
              return (
                <tr key={i} className="hover:bg-orange-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <span className="text-xs text-slate-400 mr-1">{r.local_id}</span>
                    {r.local_desc ?? r.local_id}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{r.cadena}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.articulo_desc ?? r.articulo_id}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{r.supervisor?.trim() || '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={dohClass(doh)}>{dohLabel(doh)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{n(r.stock_disponibilidad)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{n(r.stock_transito)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{n(r.l14d).toLocaleString('es-CL')}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                    {(n(r.l14d) / 14).toFixed(1)}
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

function SilenciosaTable({ rows }: { rows: StockRow[] }) {
  const [sort, setSort] = useState<SortConfig<StockRow>>({ key: 'l7d', dir: 'desc' })

  const toggle = (key: keyof StockRow) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  const sorted = sortRows(rows, sort.key, sort.dir)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
        <span className="text-sm font-semibold text-yellow-700">{rows.length} alertas silenciosas</span>
        <span className="text-xs text-yellow-600 ml-1">(sin venta ayer, con stock y ventas recientes)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Sala</th>
              <th className="px-4 py-3 text-left">Cadena</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Supervisor</th>
              <SortableTh label="Stock" sortKey="stock_disponibilidad" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="Tránsito" sortKey="stock_transito" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="Venta ayer" sortKey="d0" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="L7D" sortKey="l7d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <SortableTh label="L14D" sortKey="l14d" current={sort} onSort={toggle} className="px-4 py-3 text-right" />
              <th className="px-4 py-3 text-right">DOH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((r, i) => {
              const doh = calcDOH(n(r.stock_disponibilidad), n(r.l14d))
              return (
                <tr key={i} className="hover:bg-yellow-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <span className="text-xs text-slate-400 mr-1">{r.local_id}</span>
                    {r.local_desc ?? r.local_id}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{r.cadena}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.articulo_desc ?? r.articulo_id}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{r.supervisor?.trim() || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{n(r.stock_disponibilidad)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{n(r.stock_transito)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-yellow-600 font-semibold">0</td>
                  <td className="px-4 py-2.5 text-right font-mono">{n(r.l7d).toLocaleString('es-CL')}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{n(r.l14d).toLocaleString('es-CL')}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={dohClass(doh)}>{dohLabel(doh)}</span>
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

export default function UrgenciasTab({ quiebre, riesgo, silenciosa }: Props) {
  const [sub, setSub] = useState<SubTab>('quiebre')

  const tabs: { id: SubTab; label: string; count: number; color: string }[] = [
    { id: 'quiebre',   label: 'Quiebre',          count: quiebre.length,   color: 'red' },
    { id: 'riesgo',    label: 'Riesgo inminente',  count: riesgo.length,    color: 'orange' },
    { id: 'silenciosa', label: 'Alerta silenciosa', count: silenciosa.length, color: 'yellow' },
  ]

  const colorMap = {
    red:    { active: 'bg-red-600 text-white',    inactive: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' },
    orange: { active: 'bg-orange-500 text-white',  inactive: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200' },
    yellow: { active: 'bg-yellow-500 text-white',  inactive: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' },
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab pills */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const isActive = sub === t.id
          const cls = colorMap[t.color as keyof typeof colorMap]
          return (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? cls.active : cls.inactive}`}
            >
              {t.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/30' : 'bg-white'}`}>
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {sub === 'quiebre'    && <QuiebreTable rows={quiebre} />}
      {sub === 'riesgo'     && <RiesgoTable rows={riesgo} />}
      {sub === 'silenciosa' && <SilenciosaTable rows={silenciosa} />}
    </div>
  )
}
