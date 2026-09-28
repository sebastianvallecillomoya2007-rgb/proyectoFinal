import { t } from '../language'
import { useEffect, useState } from 'react'
import { getGames } from '../service/gamesService'
import HeroSection from './HeroSection'
import Catalog from './Catalog'
import FeaturedLists from './FeaturedLists'
import Sidebar from './Sidebar'
import Footer from './Footer'
import PurchaseDialog from './PurchaseDialog'
import { categoryLabel, gameCategories, matchesCategory } from '../categories'
import { searchWithAI } from '../service/semanticService'

export default function Store({ user, searchQuery }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [revision, setRevision] = useState(0)
  const [catalog, setCatalog] = useState(null)
  const [category, setCategory] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [order, setOrder] = useState('featured')
  const [limit, setLimit] = useState(24)
  useEffect(() => {
    let active = true
    let timer
    let pending = false
    const load = async () => {
      if (pending) return
      pending = true
      clearTimeout(timer)
      let interval = 30000
      try {
        const result = await getGames()
        if (active) { setGames(result.games); setCatalog(result.catalog); setError(''); setLoading(false) }
        if (result.catalog?.syncing) interval = 2500
      } catch (error) { if (active) { setError(error.message); setLoading(false) } }
      finally { pending = false }
      if (active) timer = setTimeout(load, interval)
    }
    load()
    window.addEventListener('focus', load)
    return () => { active = false; clearTimeout(timer); window.removeEventListener('focus', load) }
  }, [revision])
  const categories = [...new Set(games.flatMap(gameCategories))].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), 'es'))
  const platforms = [...new Map(games.flatMap(game => game.platforms || []).map(item => [item.id, item])).values()].sort((a, b) => a.name.localeCompare(b.name))
  const query = searchQuery.toLowerCase().trim()
  const [ai, setAI] = useState(null)
  const aiCatalog = JSON.stringify(games.filter(game => matchesCategory(game, category) && (platform === 'all' || game.platforms?.some(item => String(item.id) === platform))).map(({ id, title, description, categories }) => ({ id, title, description, categories })))
  useEffect(() => {
    if (order !== 'ai' || !query || aiCatalog === '[]') return
    let cancel
    const timer = setTimeout(() => {
      try { cancel = searchWithAI(JSON.parse(aiCatalog), query, result => setAI({ ...result, query, catalog: aiCatalog })) }
      catch { setAI({ query, catalog: aiCatalog, error: 'No se pudo iniciar la IA. Se conserva la búsqueda normal.' }) }
    }, 450)
    return () => { clearTimeout(timer); cancel?.() }
  }, [order, query, aiCatalog])
  const currentAI = order === 'ai' && ai?.query === query && ai?.catalog === aiCatalog ? ai : null
  const aiIds = currentAI?.results?.map(item => item.id)
  const aiMessage = order !== 'ai' ? '' : !query ? 'Escribe lo que te gustaría jugar en el buscador para usar la IA.' : currentAI?.error || currentAI?.status || 'Preparando búsqueda con IA…'
  const visible = games.filter(game => matchesCategory(game, category) && (platform === 'all' || game.platforms?.some(item => String(item.id) === platform)) && (aiIds ? aiIds.includes(game.id) : (game.title + ' ' + (game.description || '')).toLowerCase().includes(query)))
  if (order === 'ai' && aiIds) visible.sort((a, b) => aiIds.indexOf(a.id) - aiIds.indexOf(b.id))
  if (order === 'title') visible.sort((a, b) => a.title.localeCompare(b.title))
  if (order === 'stars') visible.sort((a, b) => (b.stars || 0) - (a.stars || 0))
  if (order === 'price') visible.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
  const filtered = category !== 'all' || platform !== 'all' || Boolean(query)
  function buy(game) {
    if (!user) { window.location.hash = '/login?next=' + encodeURIComponent('/juego/' + game.id); return }
    if (user.role !== 'client') { setMessage('Inicia sesión con una cuenta de cliente para realizar compras.'); return }
    setMessage(''); setSelected(game)
  }
  return <div className="container">
    <Sidebar categories={categories} category={category} onCategoryChange={value => { setCategory(value); setLimit(24) }}><Footer /></Sidebar>
    <main className="store-home">
      {message && <p className="commerce-success" role="status">{t(message)}</p>}
      {error && <p className="auth-error" role="alert">{t(error)}</p>}
      {catalog?.error && <p className="catalog-notice" role="status">{t(catalog.error)}</p>}
      {catalog?.syncing && <p className="catalog-notice" role="status">{t("Ampliando el catálogo de OpenGames… ")}{t(catalog.imported)}{catalog.total != null && t(' de ' + catalog.total)}{t(" juegos importados. Puedes seguir explorando.")}</p>}
      {loading ? <p role="status">{t("Cargando tienda…")}</p> : <>
        {!filtered && <><HeroSection games={games} onBuy={buy} /><Catalog games={games} onAddToCart={buy} /></>}
        <section className="home-section" id="all-games">
          <div className="section-header"><h2>{category === 'all' ? t('Todos los juegos') : t(categoryLabel(category))}</h2><button className="btn-redeem" onClick={() => setRevision(value => value + 1)}>{t("Actualizar tienda")}</button></div>
          <div className="catalog-toolbar">
            <label className="admin-search" htmlFor="catalog-platform">{t("Plataforma")}<select id="catalog-platform" value={platform} onChange={event => { setPlatform(event.target.value); setLimit(24) }}><option value="all">{t("Todas las plataformas")}</option>{platforms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="admin-search" htmlFor="catalog-order">{t("Ordenar por")}<select id="catalog-order" value={order} onChange={event => { setOrder(event.target.value); setLimit(24) }}><option value="featured">{t("Destacados")}</option><option value="title">{t("Nombre A–Z")}</option><option value="stars">{t("Estrellas en GitHub")}</option><option value="price">{t("Menor precio")}</option><option value="ai">{t("Afinidad con tu búsqueda (IA)")}</option></select></label>
            <p className="auth-description" role="status">{t(visible.length)}{t(" resultados · ")}{t(games.length)}{t(" juegos en el catálogo")}{aiMessage && <><br />{t(aiMessage)}</>}</p>
          </div>
          <Catalog games={visible.slice(0, limit)} view="grid" onAddToCart={buy} />
          {visible.length > limit && <button className="btn-buy catalog-load-more" onClick={() => setLimit(value => value + 24)}>{t("Mostrar más juegos (")}{t(visible.length - limit)}{t(" restantes)")}</button>}
          {!visible.length && catalog?.syncing && <p className="auth-description">{t("La búsqueda se ampliará a medida que se complete la importación.")}</p>}
        </section>
        {!filtered && <FeaturedLists games={games} onBuy={buy} />}
        <p className="catalog-attribution">{t("Catálogo ampliado con ")}<a href="https://www.open-source-games.com" target="_blank" rel="noreferrer">{t("OpenGames")}</a>{t(". Los precios disponibles corresponden a la tienda.")}</p>
      </>}
      {selected && <PurchaseDialog key={selected.id} game={selected} onClose={() => setSelected(null)} onPurchased={order => { setSelected(null); setMessage('Compra de prueba registrada: ' + order.title + ' · $' + (order.totalCents / 100).toFixed(2) + ' USD.') }} />}
    </main>
  </div>
}
