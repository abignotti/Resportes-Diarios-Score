'use client'
import type { Filters } from '@/lib/types'
import { SABOR_GRUPOS, ALL_CADENAS, CHAIN_GROUPS } from '@/lib/config'

const CADENAS = ALL_CADENAS
const GRUPO_LABELS: Record<string, string> = {
  CENCOSUD: 'Cencosud',
  WALMART: 'Walmart',
}
const SUPERVISORES = ['ALVARO', 'ELIO']
const SABORES = Object.keys(SABOR_GRUPOS)

type Props = { filters: Filters; onChange: (f: Filters) => void; lastDate?: string }

export default function FiltersBar({ filters, onChange, lastDate }: Props) {
  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  const hasActiveFilters =
    filters.cadenas.length > 0 || filters.supervisores.length > 0 ||
    filters.sala || filters.sabores.length > 0 ||
    filters.soloQuiebre || filters.soloAlertas

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap gap-4 items-start">

        {/* Cadena — agrupadas por holding */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cadena</p>
          <div className="flex gap-1.5 flex-wrap items-center">
            <button
              onClick={() => onChange({ ...filters, cadenas: [] })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${filters.cadenas.length === 0 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}
            >Todas</button>
            {Object.entries(CHAIN_GROUPS).map(([grupo, cadenas]) => {
              const allSelected = cadenas.every(c => filters.cadenas.includes(c))
              return (
                <span key={grupo} className="inline-flex items-center gap-1">
                  <button
                    onClick={() => {
                      const without = filters.cadenas.filter(c => !cadenas.includes(c))
                      onChange({ ...filters, cadenas: allSelected ? without : [...without, ...cadenas] })
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                      ${allSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400'}`}
                  >{GRUPO_LABELS[grupo] ?? grupo}</button>
                  {cadenas.map(c => (
                    <button key={c}
                      onClick={() => onChange({ ...filters, cadenas: toggle(filters.cadenas, c) })}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                        ${filters.cadenas.includes(c) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                    >{c}</button>
                  ))}
                  <span className="w-px h-4 bg-slate-200 mx-1" />
                </span>
              )
            })}
          </div>
        </div>

        {/* Supervisor */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Supervisor</p>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => onChange({ ...filters, supervisores: [] })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${filters.supervisores.length === 0 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}
            >Todos</button>
            {SUPERVISORES.map(s => (
              <button key={s}
                onClick={() => onChange({ ...filters, supervisores: toggle(filters.supervisores, s) })}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${filters.supervisores.includes(s) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-300 hover:border-purple-400'}`}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Sabor — agrupa 473ml + 500ml del mismo sabor */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            Sabor
            <span className="ml-1 font-normal text-slate-400 normal-case tracking-normal">(todos los formatos)</span>
          </p>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => onChange({ ...filters, sabores: [] })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${filters.sabores.length === 0 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}
            >Todos</button>
            {SABORES.map(s => (
              <button key={s}
                onClick={() => onChange({ ...filters, sabores: toggle(filters.sabores, s) })}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${filters.sabores.includes(s) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'}`}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Sala search */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Sala</p>
          <input
            type="text"
            value={filters.sala}
            placeholder="Buscar sala..."
            onChange={e => onChange({ ...filters, sala: e.target.value })}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Toggles */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Vista rápida</p>
          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={filters.soloQuiebre}
                onChange={e => onChange({ ...filters, soloQuiebre: e.target.checked, soloAlertas: false })}
                className="accent-red-500 w-3.5 h-3.5" />
              <span className="text-xs text-slate-600">Solo quiebre</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={filters.soloAlertas}
                onChange={e => onChange({ ...filters, soloAlertas: e.target.checked, soloQuiebre: false })}
                className="accent-orange-500 w-3.5 h-3.5" />
              <span className="text-xs text-slate-600">Solo alertas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <button
          onClick={() => onChange({ cadenas: [], supervisores: [], sala: '', sabores: [], soloQuiebre: false, soloAlertas: false })}
          className={`text-xs transition-colors ${hasActiveFilters ? 'text-blue-600 hover:text-blue-800 font-medium' : 'text-slate-300 cursor-default'}`}
          disabled={!hasActiveFilters}
        >✕ Limpiar filtros</button>
        {lastDate && <span className="text-xs text-slate-400">Stock al {lastDate}</span>}
      </div>
    </div>
  )
}
