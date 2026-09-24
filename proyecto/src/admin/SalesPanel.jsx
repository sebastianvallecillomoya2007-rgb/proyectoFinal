import { useEffect, useState } from 'react'
import { api } from '../auth/api'

const money = value => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD' }).format(value / 100)

function Ranking({ title, games, empty }) {
  return <section className="auth-card"><h2>{title}</h2>{games.length ? <ol className="sales-ranking">{games.map(game => <li key={game.id}><span>{game.title}</span><strong>{game.units} {game.units === 1 ? 'unidad' : 'unidades'}</strong><small>{money(game.revenueCents)}</small></li>)}</ol> : <p className="auth-description">{empty}</p>}</section>
}

function PriceEditor({ game, onSaved }) {
  const [basePrice, setBasePrice] = useState(game.basePrice == null ? '' : String(game.basePrice))
  const [offerPrice, setOfferPrice] = useState(game.isOffer ? String(game.price) : '')
  const [isOffer, setIsOffer] = useState(game.isOffer)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function save(event) {
    event.preventDefault()
    setError(''); setMessage(''); setBusy(true)
    try {
      const { game: updated } = await api(`/admin/games/${encodeURIComponent(game.id)}/price`, { basePrice: Number(basePrice), isOffer, offerPrice: Number(offerPrice) })
      setMessage('Precio guardado en la tienda.')
      onSaved(updated)
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <form className="price-editor auth-form" onSubmit={save}>
    <h3>{game.title}</h3>
    <p className="auth-description">{game.isUpcoming ? 'Próximo lanzamiento' : 'Disponible'} · {game.price == null ? 'Precio pendiente' : `Actual: ${money(Math.round(game.price * 100))}`}</p>
    <label htmlFor={`base-${game.id}`}>Precio normal (USD)<input id={`base-${game.id}`} type="number" min="0" max="100000" step="0.01" required value={basePrice} onChange={event => setBasePrice(event.target.value)} /></label>
    <label className="auth-checkbox"><input type="checkbox" checked={isOffer} onChange={event => setIsOffer(event.target.checked)} /> Activar oferta</label>
    {isOffer && <label htmlFor={`offer-${game.id}`}>Precio de oferta (USD)<input id={`offer-${game.id}`} type="number" min="0" max="100000" step="0.01" required value={offerPrice} onChange={event => setOfferPrice(event.target.value)} /><small>Debe ser menor que el precio normal.</small></label>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {message && <p className="commerce-success" role="status">{message}</p>}
    <button className="btn-buy" disabled={busy}>{busy ? 'Guardando…' : 'Guardar precio'}</button>
  </form>
}

export default function SalesPanel() {
  const [period, setPeriod] = useState('all')
  const [data, setData] = useState(null)
  const [games, setGames] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([api(`/admin/sales?period=${period}`), api('/games')]).then(([report, catalog]) => {
      if (active) { setData(report); setGames(catalog.games); setError(''); setLoading(false) }
    }).catch(error => { if (active) { setError(error.message); setLoading(false) } })
    return () => { active = false }
  }, [period, revision])
  function refresh() { setLoading(true); setRevision(value => value + 1) }
  return <section className="commerce-panel" aria-labelledby="sales-title">
    <p className="rawg-attribution">Catálogo e imágenes: <a href="https://rawg.io" target="_blank" rel="noreferrer">RAWG</a>. Asigna un precio a los juegos importados para habilitar sus compras.</p>
    <div className="admin-toolbar"><div><h2 id="sales-title">Compras y ventas</h2><p className="auth-description">Operaciones de prueba registradas en la tienda. No se realizan cobros.</p></div><button className="btn-redeem" onClick={refresh} disabled={loading}>Actualizar ventas</button></div>
    <label className="admin-search" htmlFor="sales-period">Periodo<select id="sales-period" value={period} onChange={event => { setPeriod(event.target.value); setLoading(true) }}><option value="all">Todo el historial</option><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option></select></label>
    {error && <p role="alert" className="auth-error">{error}</p>}
    {loading ? <p role="status">Cargando estadísticas…</p> : !error && data && <>
      <div className="sales-stats">{[['Compras realizadas', data.purchases], ['Unidades vendidas', data.units], ['Ingresos por ventas', money(data.revenueCents)], ['Promedio por compra', money(data.averageCents)], ['Clientes compradores', data.buyers]].map(([label, value]) => <section key={label} className="auth-card"><h3>{label}</h3><strong>{value}</strong></section>)}</div>
      {!data.purchases && <p className="auth-description">Todavía no hay compras en este periodo. Las estadísticas se actualizarán al confirmar compras de prueba como cliente.</p>}
      <div className="sales-rankings"><Ranking title="Juegos más vendidos" games={data.bestSellers} empty="No hay juegos vendidos en este periodo." /><Ranking title="Juegos menos vendidos" games={data.leastSellers} empty="No hay juegos disponibles." /></div>
      <p className="auth-description">Hasta 5 juegos por lista, ordenados por unidades; los empates se ordenan por nombre. Los menos vendidos incluyen juegos con cero ventas. Se excluyen próximos lanzamientos.</p>
      <section className="auth-card"><h2>Últimas compras</h2><div className="admin-table-wrapper"><table className="admin-table"><caption>Hasta 20 compras del periodo seleccionado · USD</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Cliente</th><th scope="col">Juego</th><th scope="col">Total</th></tr></thead><tbody>{data.recentOrders.map(order => <tr key={order.id}><td>{new Date(order.createdAt).toLocaleString('es-CR')}</td><td>{order.customer}</td><td>{order.title}</td><td>{money(order.totalCents)}</td></tr>)}</tbody></table>{!data.recentOrders.length && <p className="auth-description">No hay compras registradas.</p>}</div></section>
    </>}
    <section className="price-management" aria-labelledby="prices-title"><h2 id="prices-title">Precios y ofertas</h2><p className="auth-description">Los cambios se reflejan en la tienda. Al desactivar una oferta, se restaura el precio normal. Las compras anteriores conservan su importe original.</p>{notice && <p role="status" className="commerce-success">{notice}</p>}<div className="price-grid">{games.map(game => <PriceEditor key={`${game.id}-${game.basePrice}-${game.price}-${game.isOffer}`} game={game} onSaved={updated => { setGames(current => current.map(item => item.id === updated.id ? updated : item)); setNotice(`Precio de ${updated.title} guardado en la tienda.`) }} />)}</div></section>
  </section>
}
