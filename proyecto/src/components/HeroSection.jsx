import { useState } from 'react'
import GameImage from './GameImage'
import { categoryLabel, gameCategories } from '../categories'

export default function HeroSection({ games = [], onBuy, onDetails }) {
  const choices = [...games].filter(game => game.image && !game.isUpcoming).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 4)
  const [selected, setSelected] = useState(0)
  const game = choices[selected] || choices[0]
  if (!game) return null
  return <section className="discovery-hero" aria-label="Juegos destacados">
    <div className="hero-feature">
      <GameImage key={game.id} game={game} className="hero-art" eager />
      <div className="hero-vignette" />
      <div className="hero-copy"><span className="hero-pill"><span /> EN EL RADAR DE NEXUS</span>
        <h2>{game.title}</h2>
        <p>{gameCategories(game).map(categoryLabel).join(' / ')}{game.rating > 0 && ` · ★ ${game.rating.toFixed(1)} en RAWG`}</p>
        <p className="hero-description">Tu próxima gran aventura empieza aquí. Descubre un nuevo mundo y elige cómo quieres jugar.</p>
        <div className="hero-buttons"><button className="btn-buy" onClick={() => onDetails(game)}>Explorar juego <span>↗</span></button>{game.price != null && <button className="hero-price-button" onClick={() => onBuy(game)}>{game.isOffer && <del>${game.oldPrice.toFixed(2)}</del>} Comprar · ${game.price.toFixed(2)}</button>}</div>
      </div>
      <span className="hero-counter">0{choices.indexOf(game) + 1} <span>/ 0{choices.length}</span></span>
    </div>
    <div className="hero-selection"><span className="section-kicker">SELECCIÓN DESTACADA</span>{choices.map((item, index) => <button key={item.id} className={`hero-choice ${game.id === item.id ? 'selected' : ''}`} aria-pressed={game.id === item.id} onClick={() => setSelected(index)}><GameImage game={item} /><span><strong>{item.title}</strong><small>{categoryLabel(gameCategories(item)[0])}</small></span><span className="choice-arrow">↗</span></button>)}<p>Grandes historias.<br /><strong>Tu siguiente partida.</strong></p></div>
  </section>
}
