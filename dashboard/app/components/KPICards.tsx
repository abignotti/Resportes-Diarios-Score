type Props = {
  totalSalas: number
  alertasAgencia: number
  alertasRepo: number
  sinVentaAyer: number
}

export default function KPICards({ totalSalas, alertasAgencia, alertasRepo, sinVentaAyer }: Props) {
  const cards = [
    { label: 'Salas activas',         value: totalSalas,       color: 'bg-blue-50 border-blue-200 text-blue-700'   },
    { label: 'Alertas Agencia',       value: alertasAgencia,   color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { label: 'Alertas Reposición',    value: alertasRepo,      color: 'bg-red-50 border-red-200 text-red-700'       },
    { label: 'SKUs sin venta ayer',   value: sinVentaAyer,     color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
          <p className="text-sm font-medium opacity-80">{c.label}</p>
          <p className="text-3xl font-bold mt-1">{c.value.toLocaleString('es-CL')}</p>
        </div>
      ))}
    </div>
  )
}
