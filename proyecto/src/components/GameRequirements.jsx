import { t } from '../language'
import { getRequirements } from '../data/requirements'

export default function GameRequirements({ game }) {
  const requirements = getRequirements(game)
  const fields = [['os', 'Sistema operativo'], ['cpu', 'Procesador'], ['ram', 'Memoria RAM'], ['gpu', 'Tarjeta gráfica'], ['storage', 'Espacio disponible'], ['directx', 'DirectX']]
  return <section className="game-panel game-requirements" aria-label={t("Requisitos mínimos para PC")}>
    <span className="auth-eyebrow">{t("ANTES DE JUGAR")}</span>
    <h2>{t("Requisitos mínimos para PC")}</h2>
    {requirements ? <>
      <dl className="game-facts requirements-grid">{fields.map(([key, label]) => <div key={key}><dt>{t(label)}</dt><dd>{t(requirements[key])}</dd></div>)}</dl>
      {requirements.notes && <p className="media-note">{t(requirements.notes)}</p>}
      <a className="official-link" href={requirements.source} target="_blank" rel="noreferrer">{t("Consultar requisitos en ")}{requirements.sourceName || t('Steam')}{t(" ↗")}</a>
    </> : <><p className="game-description">{t("Todavía no hay requisitos mínimos de PC verificados para este juego en el catálogo.")}</p>{game.homepage && <a className="official-link" href={game.homepage} target="_blank" rel="noreferrer">{t("Consultar el sitio oficial ↗")}</a>}</>}
  </section>
}
