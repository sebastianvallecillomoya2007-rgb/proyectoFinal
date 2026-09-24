const DEFAULT_URL = 'https://opengames.dev/api'
const FALLBACK_URL = 'https://www.open-source-games.com/api'
const clean = value => typeof value === 'string' && value !== 'null' ? value.trim() : ''
const list = value => Array.isArray(value) ? value : []

export function safeUrl(value) {
  try {
    const url = new URL(clean(value))
    return ['https:', 'http:'].includes(url.protocol) ? url.href : ''
  } catch { return '' }
}

export function normalizeGame(item) {
  if (!item || !clean(item.slug) || !clean(item.title)) throw new Error('OpenGames devolvió un juego sin título o identificador.')
  const categories = [clean(item.genre).toLowerCase() || 'uncategorized']
  const screenshots = list(item.screenshotUrls).map(safeUrl).filter(Boolean)
  return {
    id: `opengames-${item.slug}`, source: 'opengames', sourceId: String(item.id || item.slug),
    slug: item.slug, title: item.title, description: clean(item.description),
    image: safeUrl(item.thumbnailUrl) || screenshots[0] || '', screenshots,
    categories, category: categories[0], platforms: list(item.platforms).filter(value => typeof value === 'string').map(name => ({ id: name.toLowerCase(), name })),
    homepage: safeUrl(item.homepage), repoUrl: safeUrl(item.repoUrl),
    sourceUrl: `https://www.open-source-games.com/games/${encodeURIComponent(item.slug)}`,
    stars: Number.isFinite(item.stars) ? item.stars : 0,
    language: clean(item.language), license: clean(item.license),
    topics: list(item.topics).filter(value => typeof value === 'string'),
    latestRelease: clean(item.latestRelease), lastCommitAt: clean(item.lastCommitAt),
    downloadCount: Number.isFinite(item.downloadCount) ? item.downloadCount : 0,
    isMultiplayer: item.isMultiplayer === true, isUpcoming: false,
  }
}

export function createOpenGames({ baseUrl = DEFAULT_URL, fallbackUrl = FALLBACK_URL, fetcher = fetch } = {}) {
  const primary = baseUrl.replace(/\/$/, '')
  const backup = primary === DEFAULT_URL ? fallbackUrl.replace(/\/$/, '') : ''
  let preferred = primary
  const cache = new Map()
  const pending = new Map()
  async function request(path) {
    if (cache.get(path)?.expires > Date.now()) return cache.get(path).data
    if (pending.has(path)) return pending.get(path)
    const task = (async () => {
      for (const base of [...new Set([preferred, backup, primary].filter(Boolean))]) {
        try {
          const response = await fetcher(`${base}${path}`, { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } })
          if (!response.ok) {
            if (response.status === 404 || response.status === 429) throw Object.assign(new Error(response.status === 429 ? 'OpenGames está recibiendo demasiadas solicitudes. Intenta más tarde.' : 'La ficha ya no está disponible en OpenGames.'), { status: response.status })
            throw new Error(`OpenGames respondió ${response.status}`)
          }
          const data = await response.json()
          if (!data.data || data.success === false) throw new Error('Respuesta de OpenGames inválida.')
          preferred = base
          cache.set(path, { data, expires: Date.now() + 300000 })
          if (cache.size > 250) cache.delete(cache.keys().next().value)
          return data
        } catch (error) {
          if (error.status) throw error
        }
      }
      throw new Error('No se pudo actualizar OpenGames. Se conserva el catálogo guardado; puedes reintentar más tarde.')
    })()
    pending.set(path, task)
    try { return await task } finally { pending.delete(path) }
  }
  return {
    configured: Boolean(primary),
    get endpoint() { return preferred },
    async page(page = 1) {
      const result = await request(`/games?page=${page}&pageSize=100&sort=stars&order=desc`)
      if (!Array.isArray(result.data.games) || !Number.isInteger(result.meta?.total) || typeof result.meta.hasMore !== 'boolean') throw new Error('La paginación de OpenGames no es válida.')
      return { games: result.data.games.map(normalizeGame), total: result.meta.total, nextPage: result.meta.hasMore ? page + 1 : null }
    },
    async detail(slug) {
      const result = await request(`/games/${encodeURIComponent(slug)}?include=related`)
      return normalizeGame(result.data.game)
    },
  }
}

export function createOpenGamesSync(provider, commerce, { delay = 900 } = {}) {
  const state = { provider: 'OpenGames', configured: provider.configured, syncing: false, total: null, nextPage: 1, error: '', updatedAt: null }
  let pending
  let attemptedAt = 0
  return {
    get state() { return { ...state, endpoint: provider.endpoint, imported: commerce.games().filter(game => game.source === 'opengames').length } },
    initialize() {
      if (!provider.configured) return Promise.resolve()
      if (pending) return pending
      if (Date.now() - attemptedAt < (state.error ? 30000 : 300000)) return Promise.resolve()
      attemptedAt = Date.now()
      state.syncing = true
      state.error = ''
      pending = (async () => {
        try {
          let page = state.nextPage || 1
          while (page) {
            const result = await provider.page(page)
            commerce.importOpenGames(result.games)
            state.total = result.total
            state.nextPage = result.nextPage
            page = result.nextPage
            if (page) await new Promise(resolve => setTimeout(resolve, delay))
          }
          state.updatedAt = new Date().toISOString()
        } catch (error) { state.error = error.message }
        finally { state.syncing = false; pending = null }
      })()
      return pending
    },
  }
}
