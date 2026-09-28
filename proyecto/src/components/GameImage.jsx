import { t } from '../language'
import { useState } from 'react'

export default function GameImage({ game, className = '', eager = false, alt = '' }) {
  const [failedUrl, setFailedUrl] = useState('')
  return game.image && failedUrl !== game.image
    ? <img className={className} src={game.image} alt={t(alt)} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedUrl(game.image)} />
    : <div className={'image-fallback ' + className} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}><span>{t("N / G")}</span><strong>{game.title}</strong><small>{t("Imagen no disponible")}</small></div>
}
