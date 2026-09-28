import { t } from '../language'
import { useEffect, useState } from 'react'
import '../css/principal.css'

export default function HeroSection({ games = [], onBuy }) {
  const slides = games.filter(game => !game.isUpcoming && game.price != null).slice(0, 3)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timerVersion, setTimerVersion] = useState(0)
  useEffect(() => {
    if (slides.length < 2) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let interval
    const configure = () => {
      clearInterval(interval)
      if (!preference.matches && document.documentElement.dataset.motion !== 'true') {
        interval = setInterval(() => setCurrentIndex(index => (index + 1) % slides.length), 5000)
      }
    }
    configure()
    preference.addEventListener('change', configure)
    window.addEventListener('nexus-settings-change', configure)
    return () => { clearInterval(interval); preference.removeEventListener('change', configure); window.removeEventListener('nexus-settings-change', configure) }
  }, [slides.length, timerVersion])
  if (!slides.length) return null
  const activeIndex = currentIndex % slides.length
  return <div className="hero-carousel" role="region" aria-roledescription={t('carrusel')} aria-label={t("Juegos destacados")}>
    <div className="carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
      {slides.map((game, index) => <div key={game.id} className="slide" inert={index !== activeIndex} style={{ backgroundImage: `url('${game.image}')` }}>
        <div className="slide-content">
          <span className="badge-discount">{game.isOffer ? t(`${game.discount} DE DESCUENTO`) : t('DISPONIBLE AHORA')}</span>
          <h1 className="slide-title"><a href={'#/juego/' + encodeURIComponent(game.id)}>{game.title}</a></h1>
          <p className="slide-desc">{t("Descubre tu próxima aventura en NEXUS GAMES.")}</p>
          {game.isOffer && <span className="old-price">{t("$")}{t(game.oldPrice.toFixed(2))}</span>}
          <button className="btn-buy" onClick={() => onBuy?.(game)}>{t("COMPRAR $")}{t(game.price.toFixed(2))}</button>
          <a className="hero-detail-link" href={'#/juego/' + encodeURIComponent(game.id)}>{t("Ver detalles →")}</a>
        </div>
      </div>)}
    </div>
    <div className="carousel-dots">{slides.map((game, index) => <button key={game.id} className={activeIndex === index ? 'dot active' : 'dot'} aria-label={t(`Ver ${game.title}`)} aria-pressed={activeIndex === index} onClick={() => { setCurrentIndex(index); setTimerVersion(value => value + 1) }} />)}</div>
  </div>
}
