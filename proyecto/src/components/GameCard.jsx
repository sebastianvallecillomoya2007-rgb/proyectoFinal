import GameImage from './GameImage'
import { gameCategories, categoryLabel } from '../categories'

export default function GameCard({ game, onAddToCart, onDetails }) {
  return <article className="game-card nexus-card">
    <button className="game-cover-button" onClick={() => onDetails?.(game)} aria-label={`Ver detalles de ${game.title}`}>
      <GameImage game={game} className="game-cover" />
      <span className="cover-shade" />
      {game.isOffer && <span className="game-label sale-label">{game.discount}</span>}
      {game.isUpcoming && <span className="game-label upcoming-label">PRÓXIMAMENTE</span>}
      {game.rating > 0 && <span className="game-rating">★ {game.rating.toFixed(1)}</span>}
      <span className="cover-action">Explorar juego ↗</span>
    </button>
    <div className="card-body">
      <p className="card-platforms">{game.platforms?.slice(0, 2).map(item => item.name).join(' · ') || 'NEXUS COLLECTION'}</p>
      <h3 className="game-title"><button onClick={() => onDetails?.(game)}>{game.title}</button></h3>
      <p className="card-genres">{gameCategories(game).map(categoryLabel).join(' · ')}</p>
      <div className="card-footer"><div className="card-price">{game.isOffer && <span className="old-price">${game.oldPrice.toFixed(2)}</span>}<strong>{game.price == null ? 'Explorar' : game.price === 0 ? 'Gratis' : `$${game.price.toFixed(2)}`}</strong></div>
        {!game.isUpcoming && game.price != null && onAddToCart ? <button className="card-action" onClick={() => onAddToCart(game)} aria-label={`Comprar ${game.title}`}>Comprar +</button> : <button className="card-action" onClick={() => onDetails?.(game)} aria-label={`Ver ficha de ${game.title}`}>Ver ficha ↗</button>}
      </div>
    </div>
  </article>
}
