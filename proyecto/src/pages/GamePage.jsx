import { t, getLocale } from '../language'
import { useEffect, useState } from 'react'
import { api } from '../auth/api'
import { getGameById } from '../service/gamesService'
import GameImage from '../components/GameImage'
import PurchaseDialog from '../components/PurchaseDialog'
import GameRequirements from '../components/GameRequirements'
import { categoryLabel, gameCategories } from '../categories'

function ReviewForm({ gameId, existing, onSaved }) {
  const [rating, setRating] = useState(existing?.rating || 5)
  const [text, setText] = useState(existing?.text || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const result = await api('/games/' + encodeURIComponent(gameId) + '/reviews', { rating, text })
      onSaved(result.reviews)
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <form className="review-form auth-form" onSubmit={submit}>
    <h3>{existing ? t('Tu reseña') : t('Comparte tu experiencia')}</h3>
    <label htmlFor="review-rating">{t("Tu valoración")}<select id="review-rating" value={rating} onChange={event => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{t(value)} {value === 1 ? t('estrella') : t('estrellas')}</option>)}</select></label>
    <label htmlFor="review-text">{t("Reseña")}<textarea id="review-text" value={text} onChange={event => setText(event.target.value)} required minLength={10} maxLength={2000} rows={4} placeholder={t("¿Qué te gustó del juego? ¿A quién se lo recomendarías?")} /></label>
    <p className="auth-description">{t("Entre 10 y 2000 caracteres. Puedes actualizar tu reseña cuando quieras.")}</p>
    {error && <p className="auth-error" role="alert">{t(error)}</p>}
    <button className="btn-buy" disabled={busy}>{busy ? t('Guardando…') : existing ? t('Actualizar reseña') : t('Publicar reseña')}</button>
  </form>
}

export default function GamePage({ id, user }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [activeImage, setActiveImage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [purchase, setPurchase] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    getGameById(id).then(result => { if (active) { setData(result); setError('') } }).catch(error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [id, user?.id, revision])
  const returnPath = '/juego/' + encodeURIComponent(id)
  const login = '#/login?next=' + encodeURIComponent(returnPath)
  async function wishlist() {
    if (!user) { window.location.hash = login; return }
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await api('/wishlist', { gameId: id, saved: !data.saved })
      setData(current => ({ ...current, saved: result.saved }))
      setMessage(result.saved ? 'Juego añadido a tu lista de deseados.' : 'Juego eliminado de tu lista de deseados.')
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  function buy() {
    if (!user) { window.location.hash = login; return }
    if (user.role !== 'client') { setError('Inicia sesión como cliente para comprar.'); return }
    setPurchase(true)
  }
  if (!data) return <main className="game-page"><a className="auth-link" href="#/">{t("← Volver a la tienda")}</a>{error ? <div className="game-panel"><p className="auth-error" role="alert">{t(error)}</p><button className="btn-redeem" onClick={() => { setError(''); setRevision(value => value + 1) }}>{t("Reintentar")}</button></div> : <p className="page-loading" role="status">{t("Cargando la ficha del juego…")}</p>}</main>
  const { game, reviews, saved, notice } = data
  const images = [...new Set([game.image, ...(game.screenshots || [])].filter(Boolean))]
  const average = reviews.length ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1) : null
  const ownReview = reviews.find(item => item.own)
  const facts = [
    ['Plataformas', game.platforms?.map(item => item.name).join(', ') || 'No especificadas'],
    ['Género', gameCategories(game).map(category => t(categoryLabel(category))).join(' · ')],
    ['Lanzamiento', game.released || game.launchDate || 'No especificado'],
    ['Última versión', game.latestRelease || 'No especificada'],
    ['Licencia', game.license || 'No especificada'],
    ['Lenguaje', game.language || 'No especificado'],
    ['Última actividad', game.lastCommitAt ? new Date(game.lastCommitAt).toLocaleDateString(getLocale()) : 'No disponible'],
  ]
  return <main className="game-page">
    <div className="game-breadcrumb"><a href="#/">{t("Tienda")}</a><span aria-hidden="true">{t("/")}</span><span>{game.title}</span></div>
    {error && <p className="auth-error" role="alert">{t(error)}</p>}
    {notice && <p className="catalog-notice" role="status">{t(notice)}</p>}
    {message && <p className="commerce-success" role="status">{t(message)}</p>}
    <div className="game-heading"><div><span className="auth-eyebrow">{game.source === 'opengames' ? t('OPENGAMES / CÓDIGO ABIERTO') : t('NEXUS / CATÁLOGO')}</span><h1>{game.title}</h1></div><a className="review-score" href={'#' + returnPath} onClick={event => { event.preventDefault(); document.getElementById('game-reviews')?.scrollIntoView({ behavior: 'smooth' }) }}><strong>{average ? t('★ ' + average) : t('☆')}</strong><span>{t(reviews.length)} {reviews.length === 1 ? t('reseña') : t('reseñas')}{t(" de jugadores")}</span></a></div>
    <div className="game-detail-layout">
      <div className="game-detail-main">
        <section className="game-gallery" aria-label={t("Imágenes del juego")}>
          <GameImage game={{ ...game, image: images[activeImage] || images[0] }} className="game-main-image" eager alt={t('Imagen de ' + game.title)} />
          {images.length > 1 && <div className="gallery-thumbnails">{images.map((src, index) => <button key={src} className={index === activeImage ? 'selected' : ''} aria-pressed={index === activeImage} aria-label={t('Ver imagen ' + (index + 1))} onClick={() => setActiveImage(index)}><GameImage game={{ ...game, image: src }} /></button>)}</div>}
          {!images.length && <p className="media-note">{t("El proveedor todavía no incluye imágenes de este juego.")}</p>}
        </section>
        <section className="game-panel"><span className="auth-eyebrow">{t("DESCUBRE EL JUEGO")}</span><h2>{t("Acerca de ")}{game.title}</h2><p className="game-description">{game.description || t('Todavía no hay una descripción disponible para este juego.')}</p>{game.topics?.length > 0 && <ul className="game-categories" aria-label={t("Etiquetas")}>{game.topics.map(topic => <li key={topic}>{t(topic)}</li>)}</ul>}</section>
        <GameRequirements game={game} />
        <section className="game-panel" id="game-reviews">
          <div className="section-header"><h2>{t("Reseñas de la comunidad")}</h2><span className="price">{average ? t(average + ' / 5') : t('Sin valoraciones')}</span></div>
          <p className="auth-description">{t("Opiniones publicadas por jugadores de NEXUS GAMES.")}</p>
          {reviews.length ? <div className="review-list">{reviews.map(review => <article className="player-review" key={review.id}><div className="review-meta"><strong>{review.author}{review.own ? t(' · Tú') : t('')}</strong><span className="review-stars" aria-label={t(review.rating + ' de 5 estrellas')}>{t('★'.repeat(review.rating))}{t('☆'.repeat(5 - review.rating))}</span><time dateTime={review.updatedAt}>{t(new Date(review.updatedAt).toLocaleDateString(getLocale()))}</time></div><p>{review.text}</p></article>)}</div> : <div className="empty-reviews"><span aria-hidden="true">{t("☆")}</span><h3>{t("La primera opinión puede ser la tuya")}</h3><p>{t("¿Ya lo jugaste? Cuéntale a la comunidad qué te pareció.")}</p></div>}
          {user?.role === 'client' ? <ReviewForm key={ownReview?.updatedAt || 'new'} gameId={id} existing={ownReview} onSaved={reviews => { setData(current => ({ ...current, reviews })); setMessage('Tu reseña se guardó correctamente.') }} /> : <p className="auth-description">{user ? t('Las reseñas se publican desde una cuenta de cliente.') : <><a className="auth-link" href={login}>{t("Inicia sesión")}</a>{t(" para publicar tu reseña.")}</>}</p>}
        </section>
      </div>
      <div className="game-detail-side">
        <section className="game-panel game-purchase-panel" aria-label={t("Precio y disponibilidad")}>
          <span className="auth-eyebrow">{t("TU PRÓXIMA PARTIDA")}</span>
          <ul className="game-categories">{gameCategories(game).map(category => <li key={category}>{t(categoryLabel(category))}</li>)}</ul>
          {game.isOffer && <del className="old-price">{t("$")}{t(game.oldPrice?.toFixed(2))}{t(" USD")}</del>}
          <p className="detail-price">{game.price == null ? t('Precio no disponible') : game.price === 0 ? t('Gratis') : t('$' + game.price.toFixed(2))}{game.price > 0 && <small>{t(" USD")}</small>}</p>
          <button className="btn-buy" disabled={game.price == null || game.isUpcoming} onClick={buy}>{game.isUpcoming ? t('Próximamente') : game.price == null ? t('Compra no disponible') : game.price === 0 ? t('Obtener juego') : t('Comprar ahora')}</button>
          <button className="btn-wishlist" aria-pressed={saved} disabled={busy} onClick={wishlist}>{busy ? t('Guardando…') : saved ? t('♥ En tu lista de deseados') : t('♡ Añadir a deseados')}</button>
          <p className="purchase-note">{game.price == null ? t('Este juego no tiene un precio asignado en la tienda. Consulta su sitio oficial para conocer las opciones disponibles.') : t('Compra de prueba en NEXUS. No se realizan cobros ni se entregan licencias.')}</p>
          {game.homepage && <a className="official-link" href={game.homepage} target="_blank" rel="noreferrer">{t("Visitar el sitio oficial ↗")}</a>}
        </section>
        <section className="game-panel"><h2>{t("Información del juego")}</h2><dl className="game-facts">{facts.map(([label, value]) => <div key={label}><dt>{t(label)}</dt><dd>{t(value)}</dd></div>)}</dl>
          {game.source === 'opengames' && <p className="github-stars">{t("★ ")}{game.stars?.toLocaleString(getLocale()) || t(0)}{t(" estrellas en GitHub ")}<small>{t("Popularidad del proyecto; no es una valoración de jugadores.")}</small></p>}
          {game.repoUrl && <a className="official-link" href={game.repoUrl} target="_blank" rel="noreferrer">{t("Ver repositorio ↗")}</a>}
          {(game.sourceUrl || game.rawgUrl) && <a className="official-link" href={game.sourceUrl || game.rawgUrl} target="_blank" rel="noreferrer">{t("Fuente: ")}{game.source === 'opengames' ? t('OpenGames') : t('RAWG')}{t(" ↗")}</a>}
        </section>
      </div>
    </div>
    {purchase && <PurchaseDialog game={game} onClose={() => setPurchase(false)} onPurchased={order => { setPurchase(false); setMessage('Compra de prueba registrada: ' + order.title + ' · $' + (order.totalCents / 100).toFixed(2) + ' USD.') }} />}
  </main>
}
