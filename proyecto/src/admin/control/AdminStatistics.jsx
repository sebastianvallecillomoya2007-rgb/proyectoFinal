import { useState } from 'react'
import SalesChart from '../SalesChart'
import { StatCard } from './components'
import { TrendChart } from './AdminDashboard'
import { dateAgo, money, salesGroups } from './model'

export default function AdminStatistics({ data }) {
  const [days, setDays] = useState(30)
  const start = dateAgo(days - 1)
  const sales = data.sales.filter(sale => sale.date >= start && sale.date <= dateAgo(0))
  const paid = sales.filter(sale => sale.status === 'Pagado')
  const users = data.users.filter(user => user.date >= start && user.date <= dateAgo(0))
  const popular = data.games.map(game => ({ id: game.id, title: game.name, units: paid.filter(sale => sale.gameId === game.id).length })).sort((a, b) => b.units - a.units).slice(0, 5)
  const rated = data.games.map(game => {
    const reviews = data.reviews.filter(review => review.game === game.name && review.status === 'Aprobada' && review.date >= start)
    return { label: game.name, value: reviews.length ? Number((reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length).toFixed(1)) : 0 }
  }).filter(row => row.value).sort((a, b) => b.value - a.value).slice(0, 5)
  const registrations = Array.from({ length: 7 }, (_, i) => {
    const from = dateAgo(Math.ceil(days / 7 * (7 - i)) - 1), to = dateAgo(Math.ceil(days / 7 * (6 - i)))
    return { label: to.slice(5), value: users.filter(user => user.date >= from && user.date <= to).length }
  })
  return <><div className="ac-page-heading"><div><p className="ac-eyebrow">ANALÍTICA</p><h1>Estadísticas<span>.</span></h1><p>Resultados derivados de las ventas pagadas y reseñas aprobadas del período.</p></div><label>Período<select value={days} onChange={event => setDays(Number(event.target.value))}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 3 meses</option><option value="365">Último año</option></select></label></div>
    <div className="ac-stats"><StatCard label="Ventas pagadas" value={paid.length} /><StatCard label="Ingresos del período" value={money(paid.reduce((sum, sale) => sum + sale.total, 0))} /><StatCard label="Usuarios registrados" value={users.length} /><StatCard label="Juegos distintos vendidos" value={new Set(paid.map(sale => sale.gameId)).size} /></div>
    <p className="ac-chart-note">Los gráficos diarios, semanales y mensuales muestran los siete intervalos más recientes de cada escala, dentro del período seleccionado. Todos los importes están en USD.</p>
    <div className="ac-charts-grid">{['Día', 'Semana', 'Mes'].map(period => <TrendChart key={period} title={`Ventas por ${period.toLowerCase()}`} values={salesGroups(sales, period)} />)}<TrendChart title="Ingresos mensuales (USD)" currency values={salesGroups(sales, 'Mes').map(row => ({ ...row, value: row.revenue }))} /><TrendChart title="Usuarios registrados" values={registrations} /><section className="ac-panel"><h2>Juegos vendidos · más populares</h2><SalesChart games={popular} /></section><TrendChart title="Juegos mejor valorados (sobre 5)" values={rated} /></div>
  </>
}
