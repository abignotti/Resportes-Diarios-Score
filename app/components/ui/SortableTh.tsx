'use client'
import type { SortConfig } from '@/lib/types'

type Props<T> = {
  label: string
  sortKey: keyof T & string
  current: SortConfig<T>
  onSort: (key: keyof T) => void
  className?: string
}

export default function SortableTh<T>({ label, sortKey, current, onSort, className = '' }: Props<T>) {
  const active = current.key === sortKey
  return (
    <th
      onClick={() => onSort(sortKey as keyof T)}
      className={`cursor-pointer select-none whitespace-nowrap hover:bg-slate-100 transition-colors ${className}`}
    >
      <span className="flex items-center justify-end gap-1">
        {label}
        <span className="text-slate-400 text-xs">
          {active ? (current.dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  )
}
