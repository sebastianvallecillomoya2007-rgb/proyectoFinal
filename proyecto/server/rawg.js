function fail(status, message) { throw Object.assign(new Error(message), { status }) }

export function normalizeGame(game, now = Date.now()) {
  if (!Number.isSafeInteger(game.id) || typeof game.name !== 'string' || !game.name.trim()) fail(502, 'RAWG devolvió un juego inválido.')
  const categories = (game.genres || []).map(genre => genre.slug === 'role-playing-games-rpg' ? 'rpg' : genre.slug).filter(Boolean)
  for (const tag of game.tags || []) {
    if (['sci-fi', 'science-fiction'].includes(tag.slug)) categories.push('scifi')
    if (tag.slug === 'horror') categories.push('horror')
  }
  const released = game.released || null
  const releaseTime = released ? Date.parse(`${released}T00:00:00Z`) : NaN
  return {
    rawgId: game.id, title: game.name.trim(), slug: game.slug,
    categories: [...new Set(categories.length ? categories : ['uncategorized'])],
    image: /^https:\/\//.test(game.background_image || '') ? game.background_image : '',
    platforms: (game.platforms || []).filter(item => item.platform?.id && item.platform?.name).map(({ platform }) => ({ id: platform.id, name: platform.name })),
    released, rating: game.rating || 0, ratingsCount: game.ratings_count || 0,
    popularity: game.added || 0, metacritic: game.metacritic || null,
    isUpcoming: Number.isFinite(releaseTime) && releaseTime > now,
    isNew: Number.isFinite(releaseTime) && releaseTime <= now && now - releaseTime < 90 * 86400000,
    isTopRated: (game.rating || 0) >= 4,
    launchDate: released || 'Por confirmar',
    releaseText: released ? `Lanzado: ${released}` : 'Fecha por confirmar',
    rawgUrl: `https://rawg.io/games/${encodeURIComponent(game.slug || String(game.id))}`,
  }
}

export function createRawg({ key = '', dates = '', platforms = '', fetcher = fetch } = {}) {
  const configured = Boolean(key.trim() && key !== 'YOUR_API_KEY')
  const cache = new Map()
  const pending = new Map()
  async function request(resource, params = {}) {
    if (!configured) fail(503, 'Configura RAWG_API_KEY en el archivo .env del servidor para conectar RAWG.')
    const cacheKey = `${resource}:${JSON.stringify(params)}`
    const cached = cache.get(cacheKey)
    if (cached?.expires > Date.now()) return cached.data
    if (pending.has(cacheKey)) return pending.get(cacheKey)
    const task = (async () => {
      const url = new URL(`https://api.rawg.io/api/${resource}`)
      url.searchParams.set('key', key)
      for (const [name, value] of Object.entries(params)) if (value) url.searchParams.set(name, String(value))
      let response
      try { response = await fetcher(url, { signal: AbortSignal.timeout(12000) }) } catch { fail(502, 'No se pudo conectar con RAWG. Intenta de nuevo más tarde.') }
      if (!response.ok) {
        if ([401, 403].includes(response.status)) fail(502, 'RAWG rechazó la clave de API. Revisa la configuración del servidor.')
        if (response.status === 429) fail(503, 'Se alcanzó el límite de solicitudes de RAWG. Intenta más tarde.')
        fail(502, 'RAWG no pudo devolver el catálogo. Intenta de nuevo más tarde.')
      }
      let data
      try { data = await response.json() } catch { fail(502, 'Respuesta inválida de RAWG.') }
      if (!Array.isArray(data.results)) fail(502, 'Respuesta inválida de RAWG.')
      // No reenviar los enlaces next/previous: contienen la clave de la API.
      const safe = { results: data.results, hasNext: Boolean(data.next), count: data.count || 0 }
      if (cache.size >= 100) cache.delete(cache.keys().next().value)
      cache.set(cacheKey, { data: safe, expires: Date.now() + 15 * 60000 })
      return safe
    })()
    pending.set(cacheKey, task)
    try { return await task } finally { pending.delete(cacheKey) }
  }
  return {
    configured,
    async collection(kind) {
      const today = new Date().toISOString().slice(0, 10)
      const past = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
      const future = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
      const filters = {
        recent: { dates: dates || `${past},${today}`, ordering: '-added' },
        upcoming: { dates: dates || `${today},${future}`, ordering: '-added' },
        indie: { dates, genres: 'indie', ordering: '-added' },
      }
      if (!filters[kind]) fail(400, 'Colección inválida.')
      const data = await request('games', { page_size: 20, platforms, ...filters[kind] })
      return data.results.map(game => normalizeGame(game))
    },
    async games(page = 1) {
      if (!Number.isInteger(page) || page < 1 || page > 10000) fail(400, 'Página de catálogo inválida.')
      if (dates && !/^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/.test(dates)) fail(400, 'RAWG_DATES debe usar el formato AAAA-MM-DD,AAAA-MM-DD.')
      if (platforms && !/^\d+(,\d+)*$/.test(platforms)) fail(400, 'RAWG_PLATFORMS debe contener IDs separados por comas.')
      const data = await request('games', { page, page_size: 40, ordering: '-added', dates, platforms })
      return { games: data.results.map(game => normalizeGame(game)), nextPage: data.hasNext ? page + 1 : null, count: data.count }
    },
    async platforms() {
      const result = []
      for (let page = 1; page <= 20; page++) {
        const data = await request('platforms', { page, page_size: 40 })
        result.push(...data.results.map(item => ({ id: item.id, name: item.name })))
        if (!data.hasNext) break
      }
      return result
    },
  }
}
