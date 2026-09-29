import { t } from '../language'
import '../css/principal.css'
import GameImage from './GameImage'
import { gameCategories, categoryLabel } from '../categories'

const cardClasses = { standard: 'game-card', offer: 'game-card deal-card', new: 'game-card release-card', upcoming: 'game-card upcoming-card' }

export default function GameCard({ game, variant = 'standard', onAddToCart, onWishlist }) {
  const href = '#/juego/' + encodeURIComponent(game.id)
  return <article className={cardClasses[variant]}>
    <a className="card-img game-cover-link" href={href} aria-label={t('Ver detalles de ' + game.title)}>
      <GameImage game={game} className="card-cover-image" />
      {game.isOffer && <span className="discount-tag">{t(game.discount)}</span>}
      {variant === 'new' && <span className="badge-new">{t("NUEVO")}</span>}
      {game.isUpcoming && <span className="badge-upcoming">{t("PRÓXIMAMENTE")}</span>}
      <span className="card-explore">{t("Ver juego ↗")}</span>
    </a>
    <div className="card-body">
      <h3 className="game-title"><a href={href}>{game.title}</a></h3>
      <ul className="game-categories" aria-label={t("Categorías")}>{gameCategories(game).map(category => <li key={category}>{t(categoryLabel(category))}</li>)}</ul>
      {game.source === 'opengames' && <p className="card-source">{t("OpenGames · Código abierto")}</p>}
      {game.source === 'freetogame' && <p className="card-source">FreeToGame · {game.platforms?.map(item => t(item.name)).join(' / ')}</p>}
      {game.isUpcoming && <p className="launch-date">{game.launchDate || t('Fecha por confirmar')}</p>}
      <div className="card-footer">
        <span className="price">{game.isOffer && <del className="old-price">{t("$")}{t(game.oldPrice?.toFixed(2))}</del>}{game.price == null ? t('Precio no disponible') : game.price === 0 ? t('Gratis') : t('$' + game.price.toFixed(2))}</span>
        {!game.isUpcoming && game.price != null && onAddToCart ? <button className="game-buy-button" onClick={() => onAddToCart(game)} aria-label={game.price === 0 ? `${t('Obtener juego')}: ${game.title}` : t('Comprar ' + game.title)}>{game.price === 0 ? t('Obtener juego') : t("Comprar")}</button> : <a className="game-buy-button" href={href} aria-label={t(`Ver ficha de ${game.title}`)}>{t("Ver ficha")}</a>}
        {onWishlist && <button className="btn-icon-wishlist" title={t("Añadir a deseados")} aria-label={t('Añadir ' + game.title + ' a deseados')} onClick={() => onWishlist(game)}>{t("♡")}</button>}
      </div>
    </div>
  </article>
}
