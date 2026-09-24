import '../css/principal.css'
import { gameCategories, categoryLabel } from '../categories'

const cardClasses = {
  standard: 'game-card',
  offer: 'game-card deal-card',
  new: 'game-card release-card',
  upcoming: 'game-card upcoming-card',
}

export default function GameCard({ game, variant = 'standard', onAddToCart, onWishlist }) {
  return (
    <div
      className={cardClasses[variant]}
      {...(variant === 'standard' ? {
        'data-category': gameCategories(game).join(' '),
        'data-title': game.title.toLowerCase(),
      } : {})}
    >
      <div className="card-img" style={{ backgroundImage: `url('${game.image}')` }}>
        {game.isOffer && <span className="discount-tag">{game.discount}</span>}
        {variant === 'new' && <span className="badge-new">NUEVO</span>}
        {variant === 'upcoming' && <span className="badge-upcoming">PRÓXIMAMENTE</span>}
      </div>
      <div className="card-body">
        <div className="game-title">{game.title}</div>
        <ul className="game-categories" aria-label="Categorías">{gameCategories(game).map(category => <li key={category}>{categoryLabel(category)}</li>)}</ul>
        {game.rawgUrl && <a className="game-source" href={game.rawgUrl} target="_blank" rel="noreferrer">Ver en RAWG ↗</a>}
        {variant === 'new' && (
          <div className="release-date"><i className="fa-regular fa-calendar"></i>{' '}{game.releaseText || 'Lanzado recientemente'}</div>
        )}
        {variant === 'upcoming' && (
          <div className="launch-date"><i className="fa-solid fa-calendar-days"></i>{' '}{game.launchDate || 'Por confirmar'}</div>
        )}
        <div className="card-footer">
          {game.isOffer && <span className="old-price">${game.oldPrice.toFixed(2)}</span>}
          <span className={variant === 'upcoming' ? 'price-preorder' : 'price'}>{game.price == null ? 'Precio pendiente' : `$${game.price.toFixed(2)}`}</span>
          {variant === 'upcoming' && onWishlist && (
            <button className="btn-icon-wishlist" title="Añadir a deseados" onClick={() => onWishlist?.(game)}><i className="fa-regular fa-bookmark"></i></button>
          )}
          {!game.isUpcoming && game.price != null && onAddToCart && (
            <button className="game-buy-button" onClick={() => onAddToCart(game)} aria-label={`Comprar ${game.title}`}>Comprar</button>
          )}
        </div>
      </div>
    </div>
  )
}
