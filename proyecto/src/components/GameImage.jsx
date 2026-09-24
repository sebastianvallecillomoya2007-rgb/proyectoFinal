import { useState } from 'react'

export default function GameImage({ game, className = '', eager = false }) {
  const [failed, setFailed] = useState(false)
  return game.image && !failed
    ? <img className={className} src={game.image} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
    : <div className={`image-fallback ${className}`} aria-hidden="true"><span>N / G</span><small>{game.title}</small></div>
}
