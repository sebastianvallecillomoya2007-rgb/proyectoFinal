import '../css/principal.css'
import GameImage from './GameImage'
import { gameCategories, categoryLabel } from '../categories'

const cardClasses = { standard: 'game-card', offer: 'game-card deal-card', new: 'game-card release-card', upcoming: 'game-card upcoming-card' }

export default function GameCard({ game, variant = 'standard', onAddToCart, onWishlist }) {
  const href = '#/juego/' + encodeURIComponent(game.id)
  return <article className={cardClasses[variant]}>
    <a className="card-img game-cover-link" href={href} aria-label={'Ver detalles de ' + game.title}>
      <GameImage game={game} className="card-cover-image" />
      {game.isOffer && <span className="discount-tag">{game.discount}</span>}
      {variant === 'new' && <span className="badge-new">NUEVO</span>}
      {game.isUpcoming && <span className="badge-upcoming">PRÓXIMAMENTE</span>}
      <span className="card-explore">Ver juego ↗</span>
    </a>
    <div className="card-body">
      <h3 className="game-title"><a href={href}>{game.title}</a></h3>
      <ul className="game-categories" aria-label="Categorías">{gameCategories(game).map(category => <li key={category}>{categoryLabel(category)}</li>)}</ul>
      {game.source === 'opengames' && <p className="card-source">OpenGames · Código abierto</p>}
      {game.isUpcoming && <p className="launch-date">{game.launchDate || 'Fecha por confirmar'}</p>}
      <div className="card-footer">
        <span className="price">{game.isOffer && <del className="old-price">${game.oldPrice?.toFixed(2)}</del>}{game.price == null ? 'Precio no disponible' : game.price === 0 ? 'Gratis' : '$' + game.price.toFixed(2)}</span>
        {!game.isUpcoming && game.price != null && onAddToCart ? <button className="game-buy-button" onClick={() => onAddToCart(game)} aria-label={'Comprar ' + game.title}>Comprar</button> : <a className="game-buy-button" href={href}>Ver ficha</a>}
        {onWishlist && <button className="btn-icon-wishlist" title="Añadir a deseados" aria-label={'Añadir ' + game.title + ' a deseados'} onClick={() => onWishlist(game)}>♡</button>}
      </div>
    </div>
  </article>
}
