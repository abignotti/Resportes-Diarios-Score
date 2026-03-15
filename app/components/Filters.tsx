'use client'
import { useRouter } from 'next/navigation'

const CADENAS     = ['TODAS', 'JUMBO', 'SANTA ISABEL', 'SPID']
const SUPERVISORES = ['TODOS', 'ALVARO', 'ELIO']

type Props = {
  cadenaActual: string
  supervisorActual: string
  soloAlertas: boolean
}

export default function Filters({ cadenaActual, supervisorActual, soloAlertas }: Props) {
  const router = useRouter()

  function update(key: string, value: string | boolean) {
    const params = new URLSearchParams(window.location.search)
    if (value === 'TODAS' || value === 'TODOS' || value === '' || value === false) {
      params.delete(key)
    } else {
      params.set(key, value === true ? '1' : String(value))
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-center">
      <span className="text-sm font-semibold text-slate-600">Filtros:</span>

      {/* Cadena */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-500">Cadena</label>
        <select
          value={cadenaActual}
          onChange={e => update('cadena', e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CADENAS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Supervisor */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-500">Supervisor</label>
        <select
          value={supervisorActual}
          onChange={e => update('supervisor', e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SUPERVISORES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Solo alertas */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={soloAlertas}
          onChange={e => update('alertas', e.target.checked)}
          className="w-4 h-4 rounded accent-red-500"
        />
        <span className="text-sm text-slate-600">Solo alertas</span>
      </label>
    </div>
  )
}
