import { useState } from 'react'
import { Link } from 'react-router-dom'
import SalesChart from '../SalesChart'
import GameImage from '../../components/GameImage'
import { DataTable, StatCard } from './components'
import { canAccess, dateAgo, displayDate, money, salesGroups } from './model'

export function TrendChart({ title, values, currency = false }) {
  const max = Math.max(1, ...values.map(item => item.value))
  return <section className="ac-panel ac-chart"><h2>{title}</h2><div className="ac-bars" role="img" aria-label={`${title}: ${values.map(item => `${item.label}: ${currency ? money(item.value) : item.value}`).join('; ')}`}>{values.map(item => <div className="ac-bar-column" key={item.label}><span>{currency ? money(item.value) : item.value}</span><div className="ac-bar-track"><i style={{ height: `${Math.max(2, item.value / max * 100)}%` }} /></div><small>{item.label}</small></div>)}</div></section>
}
export default function AdminDashboard({ store }) {
  const [period, setPeriod] = useState('Día')
  const { data, session } = store
  const allowed = key => canAccess(session.role, key)
  const paid = data.sales.filter(sale => sale.status === 'Pagado')
  const best = data.games.map(game => ({ ...game, units: paid.filter(sale => sale.gameId === game.id).length, revenue: paid.filter(sale => sale.gameId === game.id).reduce((sum, sale) => sum + sale.total, 0) })).sort((a, b) => b.units - a.units).slice(0, 5)
  const stats = [
    ['games', 'Total de juegos', data.games.length], ['users', 'Total de usuarios', data.users.length], ['sales', 'Ventas pagadas', paid.length], ['sales', 'Ingresos netos', money(paid.reduce((sum, sale) => sum + sale.total, 0))],
    ['games', 'Juegos publicados', data.games.filter(row => row.status === 'Publicado').length], ['games', 'Juegos pendientes', data.games.filter(row => row.status === 'Pendiente').length], ['users', 'Usuarios nuevos · 30 días', data.users.filter(row => row.date >= dateAgo(29)).length], ['refunds', 'Reembolsos pendientes', data.refunds.filter(row => row.status === 'Pendiente').length],
  ]
  return <><div className="ac-page-heading"><div><p className="ac-eyebrow">VISTA GENERAL</p><h1>Tu tienda, de un vistazo<span>.</span></h1><p>Hola, {session.name.split(' ')[0]}. Esto está pasando en tu universo NEXUS.</p></div><span className="ac-date">{new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: data.settings.timezone })}</span></div>
    <div className="ac-stats">{stats.filter(([key]) => allowed(key)).map(([, label, value]) => <StatCard key={label} label={label} value={value} />)}</div>
    <div className="ac-dashboard-grid">{allowed('sales') && <div><div className="ac-section-heading"><h2>Rendimiento de ventas</h2><div className="ac-segment">{['Día', 'Semana', 'Mes'].map(item => <button key={item} aria-pressed={period === item} onClick={() => setPeriod(item)}>{item}</button>)}</div></div><TrendChart title={`Ventas por ${period.toLowerCase()}`} values={salesGroups(data.sales, period)} /></div>}<section className="ac-panel"><div className="ac-section-heading"><h2>Requieren tu atención</h2><span className="ac-live-dot" /></div>{[['games', 'Juegos pendientes de aprobación', data.games.filter(row => row.status === 'Pendiente').length], ['refunds', 'Solicitudes de reembolso', data.refunds.filter(row => row.status === 'Pendiente').length], ['reviews', 'Reseñas reportadas', data.reviews.filter(row => row.status === 'Reportada').length], ['users', 'Usuarios nuevos este mes', data.users.filter(row => row.date >= dateAgo(29)).length]].filter(([key]) => allowed(key)).map(([key, label, count]) => <Link className="ac-alert-row" key={key} to={`/admin/${key}`}><span>{label}</span><strong>{count}</strong><span>↗</span></Link>)}</section></div>
    {allowed('sales') && <section className="ac-panel"><div className="ac-section-heading"><div><p className="ac-eyebrow">TOP DEL CATÁLOGO</p><h2>Juegos más vendidos</h2></div><Link to="/admin/sales">Ver todas las ventas ↗</Link></div><DataTable caption="Ranking por ventas pagadas" rows={best} columns={[{ key: 'name', label: 'Juego', render: row => <div className="ac-game-cell"><GameImage game={{ ...row, title: row.name }} alt={row.name} /><strong>{row.name}</strong></div> }, { key: 'genre', label: 'Género' }, { key: 'units', label: 'Unidades vendidas' }, { key: 'revenue', label: 'Ingresos', render: row => money(row.revenue) }]} /><details><summary>Ver gráfico de unidades vendidas</summary><SalesChart games={best.map(row => ({ ...row, title: row.name }))} /></details></section>}
    {allowed('activity') && <section className="ac-panel"><div className="ac-section-heading"><h2>Actividad reciente</h2><Link to="/admin/activity">Ver historial ↗</Link></div>{data.activity.slice(0, 5).map(row => <div className="ac-activity-row" key={row.id}><span aria-hidden="true">◷</span><p><strong>{row.action}</strong><small>{row.user} · {row.target}</small></p><time dateTime={row.date}>{displayDate(row.date, data.settings)}</time></div>)}</section>}
  </>
}
