import '../css/principal.css'

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
        'data-category': game.category,
        'data-title': game.title.toLowerCase(),
      } : {})}
    >
      <div className="card-img" style={{ backgroundImage: `url('${game.image}')` }}>
        {variant === 'offer' && <span className="discount-tag">{game.discount || '-50%'}</span>}
        {variant === 'new' && <span className="badge-new">NUEVO</span>}
        {variant === 'upcoming' && <span className="badge-upcoming">PRÓXIMAMENTE</span>}
        {variant !== 'offer' && <span className="card-category-tag">{game.category.toUpperCase()}</span>}
      </div>
      <div className="card-body">
        <div className="game-title">{game.title}</div>
        {variant === 'new' && (
          <div className="release-date"><i className="fa-regular fa-calendar"></i>{' '}{game.releaseText || 'Lanzado recientemente'}</div>
        )}
        {variant === 'upcoming' && (
          <div className="launch-date"><i className="fa-solid fa-calendar-days"></i>{' '}{game.launchDate || 'Por confirmar'}</div>
        )}
        <div className="card-footer">
          {variant === 'offer' && <span className="old-price">${game.oldPrice}</span>}
          <span className={variant === 'upcoming' ? 'price-preorder' : 'price'}>${game.price}</span>
          {variant === 'upcoming' && (
            <button className="btn-icon-wishlist" title="Añadir a deseados" onClick={() => onWishlist?.(game)}><i className="fa-regular fa-bookmark"></i></button>
          )}
          {(variant === 'standard' || variant === 'new') && (
            <i className="fa-solid fa-cart-shopping cart-icon" onClick={() => onAddToCart?.(game)}></i>
          )}
        </div>
      </div>
    </div>
  )
}
