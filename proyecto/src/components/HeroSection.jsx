import { useEffect, useState } from 'react'
import '../css/principal.css'

export default function HeroSection({ games = [], onBuy }) {
  const slides = games.filter(game => !game.isUpcoming && game.price != null).slice(0, 3)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timerVersion, setTimerVersion] = useState(0)
  useEffect(() => {
    if (slides.length < 2) return
    const interval = setInterval(() => setCurrentIndex(index => (index + 1) % slides.length), 5000)
    return () => clearInterval(interval)
  }, [slides.length, timerVersion])
  if (!slides.length) return null
  const activeIndex = currentIndex % slides.length
  return <div className="hero-carousel" aria-label="Juegos destacados">
    <div className="carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
      {slides.map((game, index) => <div key={game.id} className="slide" inert={index !== activeIndex} style={{ backgroundImage: `url('${game.image}')` }}>
        <div className="slide-content">
          <span className="badge-discount">{game.isOffer ? `${game.discount} DE DESCUENTO` : 'DISPONIBLE AHORA'}</span>
          <h1 className="slide-title">{game.title}</h1>
          <p className="slide-desc">Descubre tu próxima aventura en NEXUS GAMES.</p>
          {game.isOffer && <span className="old-price">${game.oldPrice.toFixed(2)}</span>}
          <button className="btn-buy" onClick={() => onBuy?.(game)}>COMPRAR ${game.price.toFixed(2)}</button>
        </div>
      </div>)}
    </div>
    <div className="carousel-dots">{slides.map((game, index) => <button key={game.id} className={activeIndex === index ? 'dot active' : 'dot'} aria-label={`Ver ${game.title}`} aria-pressed={activeIndex === index} onClick={() => { setCurrentIndex(index); setTimerVersion(value => value + 1) }} />)}</div>
  </div>
}
