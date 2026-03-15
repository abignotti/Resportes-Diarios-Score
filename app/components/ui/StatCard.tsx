'use client'

type Props = {
  label: string
  value: string | number
  sub?: string
  change?: number | null   // % change vs período anterior
  color?: 'blue' | 'red' | 'orange' | 'green' | 'yellow' | 'purple' | 'slate'
  large?: boolean
}

const COLOR_MAP = {
  blue:   'bg-blue-50 border-blue-200 text-blue-800',
  red:    'bg-red-50 border-red-200 text-red-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  green:  'bg-green-50 border-green-200 text-green-800',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  slate:  'bg-slate-50 border-slate-200 text-slate-700',
}

export default function StatCard({ label, value, sub, change, color = 'slate', large }: Props) {
  const cls = COLOR_MAP[color]
  const arrow = change === null || change === undefined
    ? null
    : change > 0 ? { sym: '↑', cls: 'text-green-600' }
    : change < 0 ? { sym: '↓', cls: 'text-red-500' }
    : { sym: '→', cls: 'text-slate-400' }

  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className={`font-bold mt-1 ${large ? 'text-4xl' : 'text-2xl'}`}>
        {typeof value === 'number' ? value.toLocaleString('es-CL') : value}
      </p>
      {(sub || arrow) && (
        <p className="text-xs mt-1 flex items-center gap-1 opacity-80">
          {arrow && (
            <span className={`font-semibold ${arrow.cls}`}>
              {arrow.sym} {Math.abs(change!).toFixed(1)}%
            </span>
          )}
          {sub && <span>{sub}</span>}
        </p>
      )}
    </div>
  )
}
