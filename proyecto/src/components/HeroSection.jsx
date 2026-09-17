import { useEffect, useState } from 'react'
import '../css/principal.css'

export default function HeroSection({ onBuy }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timerVersion, setTimerVersion] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(index => (index + 1) % 3)
    }, 4000)

    return () => clearInterval(interval)
  }, [timerVersion])

  function handleDotClick(index) {
    setCurrentIndex(index)
    setTimerVersion(version => version + 1)
  }

  return (
    <div className="hero-carousel">
      <div
        className="carousel-track"
        id="carouselTrack"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {/* Slide 1 */}
        <div className="slide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80')" }}>
          <div className="slide-content">
            <span className="badge-discount">-50% DISCOUNT ACTIVE</span>
            <h1 className="slide-title">NEON SYNDICATE</h1>
            <p className="slide-desc">Hack the mainframe, upgrade your chrome, and take control of the sprawling metropolis in this genre-defining action RPG.</p>
            <button className="btn-buy" onClick={() => onBuy?.(0)}>BUY NOW $29.99</button>
          </div>
        </div>
        {/* Slide 2 */}
        <div className="slide" style={{ backgroundImage: "url('https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/capsule_616x353.jpg?t=1784684281')" }}>
          <div className="slide-content">
            <span className="badge-discount">OUT NOW</span>
            <h1 className="slide-title">ELDEN RING</h1>
            <p className="slide-desc">Elden Ring es un épico juego de rol y acción de mundo abierto donde explorarás las misteriosas Tierras Intermedias. Enfréntate a poderosos enemigos, descubre secretos y forja tu propio camino en una aventura desafiante llena de combates intensos y fantasía oscura.</p>
            <button className="btn-buy" onClick={() => onBuy?.(1)}>BUY NOW $12.39</button>
          </div>
        </div>
        {/* Slide 3 */}
        <div className="slide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80')" }}>
          <div className="slide-content">
            <span className="badge-discount">-30% DISCOUNT</span>
            <h1 className="slide-title">ELDEN RING</h1>
            <p className="slide-desc">Explore deep space hazards and alien ruins in this dark Sci-Fi survival experience.</p>
            <button className="btn-buy" onClick={() => onBuy?.(2)}>BUY NOW $12.39</button>
          </div>
        </div>
      </div>
      <div className="carousel-dots" id="carouselDots">
        <div className={currentIndex === 0 ? 'dot active' : 'dot'} data-index="0" onClick={() => handleDotClick(0)}></div>
        <div className={currentIndex === 1 ? 'dot active' : 'dot'} data-index="1" onClick={() => handleDotClick(1)}></div>
        <div className={currentIndex === 2 ? 'dot active' : 'dot'} data-index="2" onClick={() => handleDotClick(2)}></div>
      </div>
    </div>
  )
}
