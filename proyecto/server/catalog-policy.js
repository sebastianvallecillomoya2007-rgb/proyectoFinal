import { readFileSync } from 'node:fs'

const localIds = new Set(JSON.parse(readFileSync(new URL('../public/db.json', import.meta.url), 'utf8')).games.map(game => String(game.id)))

export function keepCatalogGame(game) {
  if (localIds.has(String(game.id))) return true
  if (game.source === 'freetogame' || game.price === 0 || game.isFreeToPlay === true) return true
  return typeof game.image === 'string' && Boolean(game.image.trim()) &&
    typeof game.price === 'number' && Number.isFinite(game.price) && game.price > 0
}
