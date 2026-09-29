import { safeUrl } from './opengames.js'

const DEFAULT_URL = 'https://www.freetogame.com/api'
const text = value => typeof value === 'string' ? value.trim() : ''
export const freeGameCategories = ['mmorpg', 'shooter', 'strategy', 'moba', 'racing', 'sports', 'social', 'sandbox', 'open-world', 'survival', 'pvp', 'pve', 'pixel', 'voxel', 'zombie', 'turn-based', 'first-person', 'third-person', 'top-down', 'tank', 'space', 'sailing', 'side-scroller', 'superhero', 'permadeath', 'card', 'battle-royale', 'mmo', 'mmofps', 'mmotps', '3d', '2d', 'anime', 'fantasy', 'sci-fi', 'fighting', 'action-rpg', 'action', 'military', 'martial-arts', 'flight', 'low-spec', 'tower-defense', 'horror', 'mmorts']
const fail = (status, message) => { throw Object.assign(new Error(message), { status }) }

export function normalizeFreeGame(item) {
  if (!item || !Number.isInteger(item.id) || item.id < 1 || !text(item.title)) throw new Error('FreeToGame devolvió un juego sin título o identificador válido.')
  const category = text(item.genre).toLowerCase().replace(/\s+/g, '-') || 'uncategorized'
  const platforms = []
  if (/windows|pc/i.test(item.platform)) platforms.push({ id: 'windows', name: 'Windows' })
  if (/browser|web/i.test(item.platform)) platforms.push({ id: 'browser', name: 'Navegador' })
  const game = {
    id: `freetogame-${item.id}`, source: 'freetogame', sourceId: String(item.id), title: text(item.title),
    description: text(item.description) || text(item.short_description), shortDescription: text(item.short_description),
    image: safeUrl(item.thumbnail), category, categories: [category], platforms,
    developer: text(item.developer), publisher: text(item.publisher), released: text(item.release_date),
    homepage: safeUrl(item.game_url), sourceUrl: safeUrl(item.freetogame_profile_url) || 'https://www.freetogame.com/',
    price: 0, basePrice: 0, oldPrice: null, isOffer: false, discount: null, isUpcoming: false,
  }
  // Las listas no incluyen capturas ni requisitos: no borrar los detalles ya guardados.
  if (Array.isArray(item.screenshots)) game.screenshots = item.screenshots.map(shot => safeUrl(shot.image)).filter(Boolean)
  if (item.description) game.fullDescription = text(item.description)
  if (item.minimum_system_requirements && typeof item.minimum_system_requirements === 'object') {
    const requirements = item.minimum_system_requirements
    game.requirements = { os: text(requirements.os) || 'No especificado', cpu: text(requirements.processor) || 'No especificado', ram: text(requirements.memory) || 'No especificado', gpu: text(requirements.graphics) || 'No especificado', storage: text(requirements.storage) || 'No especificado', directx: 'No especificado', source: game.sourceUrl, sourceName: 'FreeToGame' }
  }
  return game
}

export function validateFreeFilters({ category = '', platform = 'all', sortBy = 'relevance' } = {}) {
  if (category && !freeGameCategories.includes(category)) fail(400, 'Categoría de FreeToGame no válida.')
  if (!['all', 'windows', 'browser', 'pc'].includes(platform)) fail(400, 'Plataforma de FreeToGame no válida.')
  if (!['release-date', 'alphabetical', 'relevance', 'popularity'].includes(sortBy)) fail(400, 'Orden de FreeToGame no válido.')
  return { category, platform: platform === 'pc' ? 'windows' : platform, sortBy }
}

export function createFreeToGame({ baseUrl = DEFAULT_URL, fetcher = fetch, timeout = 10000, ttl = 300000 } = {}) {
  const base = baseUrl.replace(/\/$/, '')
  const cache = new Map(), pending = new Map()
  let queue = Promise.resolve()
  let lastRequest = 0
  async function request(path) {
    if (!base) fail(503, 'FreeToGame está desactivado en este entorno.')
    const saved = cache.get(path)
    if (saved?.expires > Date.now()) {
      if (saved.error) throw saved.error
      return saved.data
    }
    if (pending.has(path)) return pending.get(path)
    // Espaciar peticiones y deduplicar evita ráfagas al abrir varias fichas.
    const task = queue.catch(() => {}).then(async () => {
      const wait = Math.max(0, 120 - (Date.now() - lastRequest))
      if (wait) await new Promise(resolve => setTimeout(resolve, wait))
      lastRequest = Date.now()
      try {
        const response = await fetcher(base + path, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeout) })
        if (!response.ok) fail(response.status === 404 ? 404 : 502, response.status === 404 ? 'No se encontraron juegos en FreeToGame.' : 'FreeToGame no está disponible temporalmente. Se conserva el catálogo guardado.')
        const data = await response.json()
        if (path.startsWith('/games') ? !Array.isArray(data) : !Number.isInteger(data?.id)) throw new Error('Respuesta de FreeToGame no válida.')
        cache.set(path, { data, expires: Date.now() + ttl })
        if (cache.size > 200) cache.delete(cache.keys().next().value)
        return data
      } catch (cause) {
        const error = cause.status ? cause : Object.assign(new Error('No se pudo actualizar FreeToGame. Se conserva el catálogo guardado.', { cause }), { status: 502 })
        cache.set(path, { error, expires: Date.now() + 30000 })
        if (cache.size > 200) cache.delete(cache.keys().next().value)
        throw error
      }
    })
    pending.set(path, task)
    queue = task.catch(() => {})
    try { return await task } finally { pending.delete(path) }
  }
  return {
    configured: Boolean(base),
    async list(filters = {}) {
      const { category, platform, sortBy } = validateFreeFilters(filters)
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (platform !== 'all') params.set('platform', platform)
      if (sortBy) params.set('sort-by', sortBy)
      try {
        const data = await request(`/games?${params}`)
        return data.map(normalizeFreeGame)
      } catch (error) {
        if (error.status === 404 && (category || platform !== 'all')) return []
        throw error
      }
    },
    async detail(id) {
      if (!/^[1-9]\d*$/.test(String(id))) fail(400, 'Identificador de FreeToGame no válido.')
      const data = await request(`/game?id=${id}`)
      if (String(data.id) !== String(id)) fail(502, 'FreeToGame devolvió una ficha diferente a la solicitada.')
      return normalizeFreeGame(data)
    },
  }
}

export function createFreeToGameCatalog(provider, commerce) {
  const state = { configured: provider.configured, syncing: false, error: '', updatedAt: null }
  const snapshots = new Map()
  let pending, attemptedAt = 0
  async function list(filters = {}) {
    const validated = validateFreeFilters(filters)
    const key = JSON.stringify(validated)
    try {
      const games = await provider.list(validated)
      commerce.importFreeGames(games)
      const savedGames = new Map(commerce.games().map(game => [game.id, game]))
      snapshots.set(key, games.map(game => game.id))
      if (snapshots.size > 100) snapshots.delete(snapshots.keys().next().value)
      return { games: games.map(game => savedGames.get(game.id)), notice: '', categories: freeGameCategories }
    } catch (error) {
      if (error.status === 400) throw error
      const ids = snapshots.get(key)
      let games = commerce.games().filter(game => game.source === 'freetogame')
      if (ids) games = ids.map(id => games.find(game => game.id === id)).filter(Boolean)
      else {
        games = games.filter(game => (!validated.category || game.categories.includes(validated.category)) && (validated.platform === 'all' || game.platforms.some(platform => platform.id === validated.platform)))
        if (validated.sortBy === 'alphabetical') games.sort((a, b) => a.title.localeCompare(b.title))
        if (validated.sortBy === 'release-date') games.sort((a, b) => (b.released || '').localeCompare(a.released || ''))
      }
      return { games, notice: `${error.message} Los resultados guardados pueden estar incompletos o desactualizados.`, categories: freeGameCategories }
    }
  }
  return {
    get state() { return { ...state, imported: commerce.games().filter(game => game.source === 'freetogame').length } },
    list,
    initialize() {
      if (!provider.configured) return Promise.resolve()
      if (pending) return pending
      if (Date.now() - attemptedAt < (state.error ? 30000 : 300000)) return Promise.resolve()
      attemptedAt = Date.now(); state.syncing = true
      pending = list().then(result => { state.error = result.notice; if (!result.notice) state.updatedAt = new Date().toISOString() }).catch(error => { state.error = error.message }).finally(() => { state.syncing = false; pending = null })
      return pending
    },
  }
}
