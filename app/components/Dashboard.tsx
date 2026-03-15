'use client'
import { useState, useMemo } from 'react'
import type { StockRow, Filters } from '@/lib/types'
import {
  applyFilters, calcKPIs, calcSalas, calcSkus,
  calcSupervisores, getUrgencias,
} from '@/lib/calculations'
import FiltersBar from './FiltersBar'
import ResumenTab from './tabs/ResumenTab'
import UrgenciasTab from './tabs/UrgenciasTab'
import SalaTab from './tabs/SalaTab'
import SkuTab from './tabs/SkuTab'
import SupervisorTab from './tabs/SupervisorTab'

type Tab = 'resumen' | 'urgencias' | 'salas' | 'skus' | 'supervisores'

const TABS: { id: Tab; label: string }[] = [
  { id: 'resumen',      label: 'Resumen' },
  { id: 'urgencias',   label: 'Urgencias' },
  { id: 'salas',       label: 'Por sala' },
  { id: 'skus',        label: 'Por SKU' },
  { id: 'supervisores', label: 'Supervisores' },
]

const DEFAULT_FILTERS: Filters = {
  cadenas: [], supervisores: [], sala: '', sabores: [],
  soloQuiebre: false, soloAlertas: false,
}

type Props = { initialRows: StockRow[] }

export default function Dashboard({ initialRows }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  const lastDate = useMemo(() => {
    const dates = initialRows.map(r => r.dia).filter(Boolean)
    if (!dates.length) return undefined
    return dates.sort().at(-1)!
  }, [initialRows])

  const filtered = useMemo(
    () => applyFilters(initialRows, filters),
    [initialRows, filters],
  )

  const kpis        = useMemo(() => calcKPIs(filtered),         [filtered])
  const salas       = useMemo(() => calcSalas(filtered),        [filtered])
  const skus        = useMemo(() => calcSkus(filtered),         [filtered])
  const supervisores = useMemo(() => calcSupervisores(filtered), [filtered])
  const urgencias   = useMemo(() => getUrgencias(filtered),     [filtered])

  // Badge counts for tab labels
  const badges: Partial<Record<Tab, number>> = {
    urgencias: urgencias.quiebre.length + urgencias.riesgo.length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">SC</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">Score Energy</h1>
              <p className="text-xs text-slate-400">Dashboard operacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{initialRows.length.toLocaleString('es-CL')} registros</span>
            {lastDate && <span className="bg-slate-100 rounded px-2 py-1">Stock al {lastDate}</span>}
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0 -mb-px">
            {TABS.map(t => {
              const badge = badges[t.id]
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${isActive
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    }`}
                >
                  {t.label}
                  {badge != null && badge > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold
                      ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Filters */}
        <FiltersBar filters={filters} onChange={setFilters} lastDate={lastDate} />

        {/* Active row count */}
        {(filters.cadenas.length > 0 || filters.supervisores.length > 0 || filters.sala ||
          filters.sabores.length > 0 || filters.soloQuiebre || filters.soloAlertas) && (
          <p className="text-xs text-slate-400">
            Mostrando {filtered.length.toLocaleString('es-CL')} de {initialRows.length.toLocaleString('es-CL')} registros
          </p>
        )}

        {/* Tab content */}
        {activeTab === 'resumen'      && <ResumenTab kpis={kpis} skus={skus} />}
        {activeTab === 'urgencias'    && <UrgenciasTab {...urgencias} />}
        {activeTab === 'salas'        && <SalaTab salas={salas} />}
        {activeTab === 'skus'         && <SkuTab skus={skus} />}
        {activeTab === 'supervisores' && <SupervisorTab supervisores={supervisores} />}
      </main>
    </div>
  )
}
