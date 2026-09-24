import { useEffect, useRef } from 'react'
import GameImage from './GameImage'
import { categoryLabel, gameCategories } from '../categories'

export default function GameDetails({ game, onClose, onBuy }) {
  const dialog = useRef(null)
  useEffect(() => { dialog.current.showModal() }, [])
  return <dialog ref={dialog} className="game-details" aria-labelledby="detail-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <button className="detail-close" onClick={onClose} aria-label="Cerrar ficha">×</button>
    <GameImage game={game} className="detail-cover" eager />
    <div className="detail-content"><span className="section-kicker">EXPLORA EL JUEGO</span><h2 id="detail-title">{game.title}</h2>
      <ul className="game-categories">{gameCategories(game).map(item => <li key={item}>{categoryLabel(item)}</li>)}</ul>
      <dl className="detail-facts"><div><dt>Lanzamiento</dt><dd>{game.released || game.launchDate || 'No disponible'}</dd></div><div><dt>Valoración RAWG</dt><dd>{game.rating ? `${game.rating.toFixed(1)} / 5` : 'Sin valoración'}</dd></div><div><dt>Plataformas</dt><dd>{game.platforms?.map(item => item.name).join(', ') || 'No especificadas'}</dd></div></dl>
      <div className="detail-actions">{game.price != null && !game.isUpcoming ? <button className="btn-buy" onClick={() => onBuy(game)}>Comprar · ${game.price.toFixed(2)}</button> : <span className="detail-availability">{game.isUpcoming ? 'Próximamente' : 'Precio aún no disponible'}</span>}{game.rawgUrl && <a className="secondary-button" href={game.rawgUrl} target="_blank" rel="noreferrer">Más información en RAWG ↗</a>}</div>
      {game.rawgId && <p className="rawg-attribution">Datos e imágenes de <a href="https://rawg.io" target="_blank" rel="noreferrer">RAWG</a>.</p>}
    </div>
  </dialog>
}
