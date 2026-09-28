import { t } from '../language'
import { useId } from 'react'

export default function SalesChart({ games }) {
  const id = useId()
  const maximum = Math.max(1, ...games.map(game => game.units))
  return <svg viewBox={`0 0 440 ${Math.max(90, games.length * 65 + 25)}`} width="100%" role="img" aria-labelledby={id + '-title ' + id + '-desc'}>
    <title id={id + '-title'}>{t("Unidades vendidas por juego")}</title>
    <desc id={id + '-desc'}>{games.length ? games.map(game => `${game.title}: ${game.units} unidades`).join('. ') : t('Todavía no hay ventas en este periodo.')}</desc>
    {games.length ? games.map((game, index) => <g key={game.id} transform={`translate(0, ${index * 65 + 10})`}>
      <text x="0" y="14" fill="currentColor" fontSize="14">{game.title.length > 44 ? game.title.slice(0, 41) + '…' : game.title}</text>
      <rect x="0" y="24" width={Math.max(1, game.units / maximum * 350)} height="20" rx="3" fill="var(--neon-cyan)" />
      <text x="360" y="40" fill="currentColor" fontSize="16">{t(game.units)}</text>
    </g>) : <text x="0" y="40" fill="currentColor" fontSize="16">{t("Sin ventas en este periodo")}</text>}
  </svg>
}
