import { useEffect, useState } from 'react'
import GameCard from './GameCard'
import '../css/principal.css'
import { matchesCategory } from '../categories'

const homeSections = [
  { flag: 'isUpcoming', variant: 'upcoming', id: 'upcomingGrid', className: 'upcoming-grid', icon: 'fa-regular fa-clock', title: 'PRÓXIMOS LANZAMIENTOS', link: 'Ver Calendario' },
  { flag: 'isNew', variant: 'new', id: 'newReleasesGrid', className: 'releases-grid', icon: 'fa-solid fa-sparkles', title: 'NUEVOS LANZAMIENTOS', link: 'Ver Todos' },
  { flag: 'isOffer', variant: 'offer', id: 'offersGrid', className: 'deals-grid', icon: 'fa-solid fa-tags', title: 'SPECIAL OFFERS', link: 'View All' },
]

export default function Catalog({
  games,
  apiUrl = '/api/games',
  searchQuery = '',
  category = 'all',
  view = 'home',
  onAddToCart,
  onWishlist,
}) {
  const [loadedGames, setLoadedGames] = useState([])
  const [isLoading, setIsLoading] = useState(games === undefined)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (games !== undefined) return

    const controller = new AbortController()

    async function fetchGames() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(apiUrl, { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        const list = Array.isArray(data) ? data : data?.games
        if (!Array.isArray(list)) throw new Error('La respuesta no contiene un arreglo de juegos')
        if (list.some(game => !game || typeof game.title !== 'string' || typeof game.category !== 'string' || typeof game.image !== 'string' || game.id == null)) {
          throw new Error('Los juegos deben incluir id, title, category e image')
        }
        if (!controller.signal.aborted) setLoadedGames(list)
      } catch (error) {
        if (!controller.signal.aborted) setError(error)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    fetchGames()
    return () => controller.abort()
  }, [apiUrl, games])

  useEffect(() => {
    if (error && games === undefined) console.error('Error al conectar con db.json:', error)
  }, [error, games])

  const loading = games === undefined && isLoading

  const query = searchQuery.toLowerCase().trim()
  const filteredGames = (games ?? loadedGames).filter(game => (
    matchesCategory(game, category) && game.title.toLowerCase().includes(query)
  ))

  function renderCards(list, variant) {
    return list.map(game => (
      <GameCard
        key={game.id}
        game={game}
        variant={variant}
        onAddToCart={onAddToCart}
        onWishlist={onWishlist}
      />
    ))
  }

  if (view === 'grid') {
    return <><div className="games-grid" id="gamesGrid" aria-busy={loading}>{renderCards(filteredGames, 'standard')}</div>{!loading && filteredGames.length === 0 && <p className="auth-description">No hay juegos cargados que coincidan con estos filtros.</p>}</>
  }

  return (
    <>
      {homeSections.map(section => (
        <section className="home-section" key={section.id}>
          <div className="section-header">
            <h2><i className={section.icon}></i>{' '}{section.title}</h2>
            <a href="#all-games" className="see-more" onClick={event => { event.preventDefault(); document.getElementById('all-games')?.scrollIntoView({ behavior: 'smooth' }) }}>{section.link}</a>
          </div>
          <div className={section.className} id={section.id} aria-busy={loading}>
            {renderCards(filteredGames.filter(game => game[section.flag]), section.variant)}
          </div>
        </section>
      ))}
    </>
  )
}
