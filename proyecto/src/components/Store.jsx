import { useEffect, useRef, useState } from 'react'
import { api } from '../auth/api'
import HeroSection from './HeroSection'
import Catalog from './Catalog'
import FeaturedLists from './FeaturedLists'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { categoryLabel, gameCategories, matchesCategory } from '../categories'

function PurchaseDialog({ game, onClose, onPurchased }) {
  const dialog = useRef(null)
  const [requestId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { dialog.current.showModal() }, [])
  async function confirm() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const { order } = await api('/orders', { gameId: game.id, expectedPrice: game.price, requestId })
      onPurchased(order)
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="purchase-dialog auth-card" aria-labelledby="purchase-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <h2 id="purchase-title">Confirmar compra de prueba</h2>
    <p className="auth-description">Esta operación se registrará en las estadísticas. No se realizará ningún cobro.</p>
    <p>{game.title}</p><p className="purchase-total">Total: ${game.price.toFixed(2)} USD</p>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <div className="purchase-actions"><button className="btn-redeem" onClick={onClose} disabled={busy}>Cancelar</button><button className="btn-buy" onClick={confirm} disabled={busy}>{busy ? 'Registrando…' : 'Confirmar compra de prueba'}</button></div>
  </dialog>
}

export default function Store({ user, searchQuery }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [revision, setRevision] = useState(0)
  const [rawg, setRawg] = useState(null)
  const [moreLoading, setMoreLoading] = useState(false)
  const [category, setCategory] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [platforms, setPlatforms] = useState([])
  useEffect(() => {
    let active = true
    const load = () => api('/games').then(result => {
      if (active) { setGames(result.games); setRawg(result.rawg); setError(''); setLoading(false) }
    }).catch(error => { if (active) { setError(error.message); setLoading(false) } })
    load()
    window.addEventListener('focus', load)
    const timer = setInterval(load, 30000)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', load) }
  }, [revision])
  useEffect(() => {
    if (!rawg?.configured) return
    let active = true
    api('/platforms').then(result => { if (active) setPlatforms(result.platforms) }).catch(() => { /* Se conservan las plataformas de los juegos guardados. */ })
    return () => { active = false }
  }, [rawg?.configured])
  async function loadMore() {
    if (moreLoading) return
    setMoreLoading(true); setError('')
    try {
      const result = await api(`/games?rawgPage=${rawg.nextPage}`)
      setGames(result.games); setRawg(result.rawg)
    } catch (error) { setError(error.message) } finally { setMoreLoading(false) }
  }
  const categories = [...new Set(games.flatMap(gameCategories))].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), 'es'))
  const platformOptions = [...new Map([...games.flatMap(game => game.platforms || []), ...platforms].map(item => [item.id, item])).values()].sort((a, b) => a.name.localeCompare(b.name))
  const visibleGames = games.filter(game => matchesCategory(game, category) && (platform === 'all' || game.platforms?.some(item => String(item.id) === platform)))
  const filtered = category !== 'all' || platform !== 'all' || Boolean(searchQuery)
  function buy(game) {
    if (!user) { window.location.hash = '/login'; return }
    if (user.role !== 'client') { setMessage('Inicia sesión con una cuenta de cliente para realizar compras.'); return }
    setMessage(''); setSelected(game)
  }
  return <div className="container"><Sidebar categories={categories} category={category} onCategoryChange={setCategory}><Footer /></Sidebar><main className="store-home">
    {message && <p className="commerce-success" role="status">{message}</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {loading ? <p role="status">Cargando tienda…</p> : <>
      <div className="catalog-toolbar"><label className="admin-search" htmlFor="catalog-platform">Plataforma<select id="catalog-platform" value={platform} onChange={event => setPlatform(event.target.value)}><option value="all">Todas las plataformas</option>{platformOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p className="auth-description">{games.length} juegos cargados · Cada juego puede pertenecer a varias categorías.</p></div>
      {rawg?.error && <p className="auth-error" role="status">{rawg.error} Se conserva el catálogo guardado.</p>}
      {!filtered && <><HeroSection games={games} onBuy={buy} /><Catalog games={games} onAddToCart={buy} /></>}
      <section className="home-section" id="all-games"><div className="section-header"><h2>{category === 'all' ? 'Todos los juegos' : categoryLabel(category)}</h2><button className="btn-redeem" onClick={() => setRevision(value => value + 1)}>Actualizar tienda</button></div><Catalog games={visibleGames} searchQuery={searchQuery} view="grid" onAddToCart={buy} /></section>
      {rawg?.configured && rawg.nextPage && <button className="btn-buy catalog-load-more" disabled={moreLoading} onClick={loadMore}>{moreLoading ? 'Cargando juegos…' : 'Cargar más juegos de RAWG'}</button>}
      <p className="auth-description">La búsqueda y los filtros se aplican a los juegos cargados.</p>
      {!filtered && <FeaturedLists games={games} onBuy={buy} />}
      <p className="rawg-attribution">Datos e imágenes de videojuegos: <a href="https://rawg.io" target="_blank" rel="noreferrer">RAWG</a>.</p>
    </>}
    {selected && <PurchaseDialog key={selected.id} game={selected} onClose={() => setSelected(null)} onPurchased={order => { setSelected(null); setMessage(`Compra de prueba registrada: ${order.title} · $${(order.totalCents / 100).toFixed(2)} USD.`) }} />}
  </main></div>
}
