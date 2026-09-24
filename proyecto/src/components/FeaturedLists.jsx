import '../css/principal.css'

import { gameCategories, categoryLabel } from '../categories'

export default function FeaturedLists({ games = [], onBuy }) {
  const sections = [
    { title: 'Nuevos lanzamientos', games: games.filter(game => game.isNew && !game.isUpcoming) },
    { title: 'Mejor valorados', games: games.filter(game => game.isTopRated && !game.isUpcoming) },
  ]
  return <section className="home-section split-section">
    {sections.map(section => <div className="column" key={section.title}>
      <h3>{section.title}</h3>
      <div className="mini-list">{section.games.slice(0, 3).map(game => <div className="mini-item" key={game.id}>
        <img src={game.image} alt="" />
        <div className="mini-info"><span className="mini-title">{game.title}</span><span className="mini-tag">{gameCategories(game).map(categoryLabel).join(' · ')}</span></div>
        <span className="price">{game.price == null ? 'Precio pendiente' : `$${game.price.toFixed(2)}`}</span>
        {game.price != null && <button className="game-buy-button" onClick={() => onBuy?.(game)} aria-label={`Comprar ${game.title}`}>Comprar</button>}
      </div>)}{!section.games.length && <p className="auth-description">No hay juegos en esta sección.</p>}</div>
    </div>)}
  </section>
}
