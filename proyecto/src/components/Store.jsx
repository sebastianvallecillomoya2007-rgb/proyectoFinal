import { useEffect, useRef, useState } from 'react'
import { api } from '../auth/api'
import HeroSection from './HeroSection'
import GameCard from './GameCard'
import GameDetails from './GameDetails'
import GameImage from './GameImage'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { categoryLabel, gameCategories, matchesCategory } from '../categories'

const getView = () => new URLSearchParams(window.location.hash.split('?')[1] || '').get('view') || 'discover'
const getCategory = () => new URLSearchParams(window.location.hash.split('?')[1] || '').get('genre') || 'all'
const sortGames = (games, order) => [...games].sort((a, b) => {
  if (order === 'rating') return (b.rating || 0) - (a.rating || 0)
  if (order === 'recent') return (b.released || '').localeCompare(a.released || '')
  if (order === 'name') return a.title.localeCompare(b.title, 'es')
  if (order === 'price') return (a.price ?? Infinity) - (b.price ?? Infinity)
  return (b.popularity || 0) - (a.popularity || 0)
})

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
  return <dialog ref={dialog} className="purchase-dialog auth-card" aria-labelledby="purchase-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}><h2 id="purchase-title">Confirmar compra de prueba</h2><p className="auth-description">Esta operación se registrará en las estadísticas. No se realizará ningún cobro.</p><p>{game.title}</p><p className="purchase-total">Total: ${game.price.toFixed(2)} USD</p>{error && <p role="alert" className="auth-error">{error}</p>}<div className="purchase-actions"><button className="secondary-button" onClick={onClose} disabled={busy}>Cancelar</button><button className="btn-buy" onClick={confirm} disabled={busy}>{busy ? 'Registrando…' : 'Confirmar compra de prueba'}</button></div></dialog>
}

function GameShelf({ title, subtitle, games, onBuy, onDetails, onBrowse }) {
  if (!games.length) return null
  return <section className="game-shelf"><div className="shelf-heading"><div><p className="section-kicker">{subtitle}</p><h2>{title}</h2></div><button className="text-button" onClick={onBrowse}>Explorar más <span>→</span></button></div><div className="shelf-grid">{games.slice(0, 4).map(game => <GameCard key={game.id} game={game} onAddToCart={onBuy} onDetails={onDetails} />)}</div></section>
}

export default function Store({ user, searchQuery }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [message, setMessage] = useState('')
  const [rawg, setRawg] = useState(null)
  const [moreLoading, setMoreLoading] = useState(false)
  const [category, setCategory] = useState(getCategory)
  const [platform, setPlatform] = useState('all')
  const [platforms, setPlatforms] = useState([])
  const [view, setView] = useState(getView)
  const [order, setOrder] = useState('popular')
  const [limit, setLimit] = useState(24)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const navigate = () => { setView(getView()); setCategory(getCategory()); setLimit(24) }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  useEffect(() => {
    let active = true
    let timer
    const load = async () => {
      clearTimeout(timer)
      let interval = 30000
      try {
        const result = await api('/games')
        if (active) { setGames(result.games); setRawg(result.rawg); setLoading(false) }
        if (result.rawg?.syncing) interval = 2500
      } catch (error) { if (active) { setError(error.message); setLoading(false) } }
      if (active) timer = setTimeout(load, interval)
    }
    load()
    window.addEventListener('focus', load)
    return () => { active = false; clearTimeout(timer); window.removeEventListener('focus', load) }
  }, [revision])
  useEffect(() => {
    if (!rawg?.configured) return
    let active = true
    api('/platforms').then(result => { if (active) setPlatforms(result.platforms) }).catch(() => {})
    return () => { active = false }
  }, [rawg?.configured])
  async function loadMore() {
    if (moreLoading || rawg?.syncing) return
    setMoreLoading(true); setError('')
    try {
      const result = await api(`/games?rawgPage=${rawg.nextPage}`)
      setGames(result.games); setRawg(result.rawg); setLimit(value => value + 24)
    } catch (error) { setError(error.message) } finally { setMoreLoading(false) }
  }
  function navigate(next) {
    setView(next); setCategory('all'); setPlatform('all'); setLimit(24)
    window.location.hash = next === 'discover' ? '/' : `/?view=${next}`
  }
  function chooseCategory(next) { setCategory(next); setView('all'); setLimit(24); window.location.hash = `/?view=all&genre=${encodeURIComponent(next)}` }
  function buy(game) {
    setDetails(null)
    if (!user) { window.location.hash = '/login'; return }
    if (user.role !== 'client') { setMessage('Inicia sesión como cliente para realizar compras.'); return }
    setMessage(''); setSelected(game)
  }
  const counts = {}
  games.forEach(game => gameCategories(game).forEach(item => { counts[item] = (counts[item] || 0) + 1 }))
  const categories = Object.keys(counts).sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), 'es'))
  const platformOptions = [...new Map([...games.flatMap(game => game.platforms || []), ...platforms].map(item => [item.id, item])).values()].sort((a, b) => a.name.localeCompare(b.name))
  const visibleGames = sortGames(games.filter(game => matchesCategory(game, category) && game.title.toLowerCase().includes(searchQuery.toLowerCase()) && (platform === 'all' || game.platforms?.some(item => String(item.id) === platform)) && (view !== 'offers' || game.isOffer) && (view !== 'upcoming' || game.isUpcoming)), order)
  const discovering = view === 'discover' && category === 'all' && platform === 'all' && !searchQuery
  const popular = sortGames(games.filter(game => !game.isUpcoming), 'popular')
  const rated = sortGames(games.filter(game => game.rating > 0), 'rating')
  const recent = sortGames(games.filter(game => game.isNew), 'recent')
  const offers = games.filter(game => game.isOffer)
  const upcoming = games.filter(game => game.isUpcoming)
  const genres = ['action', 'rpg', 'indie', 'adventure', 'scifi', 'horror'].filter(item => counts[item]).slice(0, 4)
  const title = category !== 'all' ? categoryLabel(category) : view === 'offers' ? 'Ofertas para tu próxima partida' : view === 'upcoming' ? 'Lo que está por llegar' : 'Encuentra tu próximo juego'
  return <div className="container discovery-layout"><Sidebar categories={categories} category={category} counts={counts} view={view} onCategoryChange={chooseCategory} onViewChange={navigate} /><main className="store-home discovery-main">
    <div className="store-intro"><div><span className="section-kicker">NEXUS GAMES / {discovering ? 'DESCUBRIR' : 'CATÁLOGO'}</span><h1>{discovering ? <>Tu próximo <em>universo.</em></> : title}</h1><p>{discovering ? 'Grandes historias, nuevos desafíos y juegos que se quedan contigo.' : 'Explora géneros, compara plataformas y descubre nuevas historias.'}</p></div><span className="catalog-status"><span className="status-dot" />{games.length} juegos para explorar</span></div>
    <div className="store-tabs" aria-label="Secciones de la tienda">{[['discover', 'Para ti'], ['all', 'Explorar catálogo'], ['offers', 'Ofertas'], ['upcoming', 'Próximamente']].map(([id, label]) => <button key={id} className={view === id && category === 'all' ? 'active' : ''} aria-pressed={view === id && category === 'all'} onClick={() => navigate(id)}>{label}{id === 'offers' && offers.length > 0 && <small>{offers.length}</small>}</button>)}</div>
    {message && <p className="commerce-success" role="status">{message}</p>}
    {error && <div className="auth-error" role="alert">{error} <button className="text-button" onClick={() => { setError(''); setRevision(value => value + 1) }}>Reintentar</button></div>}
    {rawg?.error && <p className="catalog-notice" role="status">No se pudo completar la actualización. Puedes explorar los juegos guardados.</p>}
    {rawg?.syncing && <p className="catalog-notice" role="status"><span className="status-dot" /> Estamos ampliando tu catálogo. Puedes seguir explorando.</p>}
    {loading ? <div className="catalog-skeleton" role="status" aria-label="Cargando catálogo"><div /><div /><div /><div /></div> : <>
      {discovering && <>
        <HeroSection games={popular} onBuy={buy} onDetails={setDetails} />
        <div className="discovery-benefits"><span>◈ <strong>Tu mundo, tu género</strong> Explora sin límites</span><span>▦ <strong>Todas tus plataformas</strong> Un solo catálogo</span><span>↗ <strong>Siempre por descubrir</strong> Encuentra tu próxima historia</span></div>
        <GameShelf title="En el radar" subtitle="DESCUBRE LOS FAVORITOS" games={popular} onBuy={buy} onDetails={setDetails} onBrowse={() => navigate('all')} />
        <section className="genre-section"><div className="shelf-heading"><div><span className="section-kicker">ELIGE TU CAMINO</span><h2>Un género para cada jugador</h2></div></div><div className="genre-grid">{genres.map((genre, index) => { const game = games.find(item => gameCategories(item).includes(genre) && item.image); return <button key={genre} className={`genre-tile genre-${index}`} onClick={() => chooseCategory(genre)}>{game && <GameImage game={game} />}<span className="genre-overlay" /><span className="genre-tile-copy"><small>0{index + 1} / EXPLORAR</small><strong>{categoryLabel(genre)}</strong><span>{counts[genre]} juegos <b>↗</b></span></span></button> })}</div></section>
        <GameShelf title="Más juego, mejor precio" subtitle="OFERTAS DE NEXUS" games={offers} onBuy={buy} onDetails={setDetails} onBrowse={() => navigate('offers')} />
        {rated.length > 0 && <GameShelf title="Historias que dejan huella" subtitle="LOS MEJOR VALORADOS EN RAWG" games={rated} onBuy={buy} onDetails={setDetails} onBrowse={() => { navigate('all'); setOrder('rating') }} />}
        <section className="discovery-banner"><div><span className="section-kicker">FUERA DE LO HABITUAL</span><h2>Pequeños estudios.<br /><em>Grandes experiencias.</em></h2><p>Descubre la creatividad de los juegos independientes.</p><button className="secondary-button" onClick={() => chooseCategory('indie')}>Explorar independientes ↗</button></div><span className="banner-monogram" aria-hidden="true">N<span>↗</span></span></section>
        <GameShelf title="Nuevas aventuras" subtitle="NUEVOS LANZAMIENTOS" games={recent} onBuy={buy} onDetails={setDetails} onBrowse={() => { navigate('all'); setOrder('recent') }} />
        <GameShelf title="El siguiente nivel está cerca" subtitle="PRÓXIMAMENTE" games={upcoming} onBuy={buy} onDetails={setDetails} onBrowse={() => navigate('upcoming')} />
      </>}
      <section className="full-catalog" id="all-games"><div className="shelf-heading"><div><span className="section-kicker">SIGUE EXPLORANDO</span><h2>{discovering ? 'La biblioteca NEXUS' : 'Tu selección'}</h2></div><span className="result-count">{visibleGames.length} resultados</span></div>
        <div className="discovery-filters"><label htmlFor="catalog-platform">Plataforma<select id="catalog-platform" value={platform} onChange={event => { setPlatform(event.target.value); setLimit(24) }}><option value="all">Todas las plataformas</option>{platformOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label htmlFor="catalog-category">Género<select id="catalog-category" value={category} onChange={event => { setCategory(event.target.value); setLimit(24) }}><option value="all">Todos los géneros</option>{categories.map(item => <option key={item} value={item}>{categoryLabel(item)}</option>)}</select></label><label htmlFor="catalog-order">Ordenar por<select id="catalog-order" value={order} onChange={event => { setOrder(event.target.value); setLimit(24) }}><option value="popular">Popularidad</option><option value="rating">Mejor valorados</option><option value="recent">Lanzamiento más reciente</option><option value="price">Menor precio</option><option value="name">Nombre A–Z</option></select></label></div>
        <div className="games-grid discovery-grid">{visibleGames.slice(0, limit).map(game => <GameCard key={game.id} game={game} onAddToCart={buy} onDetails={setDetails} />)}</div>
        {!visibleGames.length && <div className="catalog-empty"><span>⌕</span><h3>No encontramos juegos con estos filtros</h3><p>Prueba otro nombre, género o plataforma.</p><button className="secondary-button" onClick={() => { setCategory('all'); setPlatform('all'); setView('all') }}>Restablecer género y plataforma</button></div>}
        <div className="catalog-pagination"><p>Mostrando {Math.min(limit, visibleGames.length)} de {visibleGames.length} juegos cargados</p>{limit < visibleGames.length ? <button className="secondary-button" onClick={() => setLimit(value => value + 24)}>Mostrar más juegos ↓</button> : rawg?.configured && rawg.nextPage && <button className="secondary-button" disabled={moreLoading || rawg.syncing} onClick={loadMore}>{moreLoading || rawg.syncing ? 'Ampliando catálogo…' : 'Descubrir más juegos ↓'}</button>}</div>
      </section>
      {!user && <section className="join-nexus"><div><span className="section-kicker">TU PRÓXIMA PARTIDA EMPIEZA AQUÍ</span><h2>Forma parte de NEXUS.</h2><p>Crea tu cuenta y encuentra tu próximo juego favorito.</p></div><a className="account-register" href="#/registro">Crear mi cuenta ↗</a></section>}
      <Footer />
    </>}
    {details && <GameDetails key={details.id} game={details} onClose={() => setDetails(null)} onBuy={buy} />}
    {selected && <PurchaseDialog key={selected.id} game={selected} onClose={() => setSelected(null)} onPurchased={order => { setSelected(null); setMessage(`Compra de prueba registrada: ${order.title} · $${(order.totalCents / 100).toFixed(2)} USD.`) }} />}
  </main></div>
}
