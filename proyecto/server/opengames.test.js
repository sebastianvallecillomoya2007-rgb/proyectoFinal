import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createOpenGames, createOpenGamesSync, normalizeGame } from './opengames.js'

const raw = { id: 'veloren-veloren', slug: 'veloren', title: 'Veloren', genre: 'RPG', description: 'Voxel RPG', platforms: ['Linux'], thumbnailUrl: null, screenshotUrls: ['https://example.com/screen.png', 'javascript:alert(1)'], homepage: 'null', latestRelease: 'null', stars: 52 }
const payload = { data: { games: [raw] }, meta: { page: 1, total: 101, hasMore: true } }
test('OpenGames: normaliza los datos reales sin inventar precios ni reseñas', () => {
  const game = normalizeGame(raw)
  assert.equal(game.id, 'opengames-veloren')
  assert.deepEqual(game.categories, ['rpg'])
  assert.deepEqual(game.platforms, [{ id: 'linux', name: 'Linux' }])
  assert.deepEqual(game.screenshots, ['https://example.com/screen.png'])
  assert.equal(game.image, game.screenshots[0])
  assert.equal(game.homepage, '')
  assert.equal(game.latestRelease, '')
  assert.equal(game.price, undefined)
  assert.equal(game.rating, undefined)
  assert.throws(() => normalizeGame({}), /identificador/)
})
test('OpenGames: respaldo, paginación y caché evitan solicitudes repetidas', async () => {
  const calls = []
  const provider = createOpenGames({ fetcher: async url => {
    calls.push(url)
    if (url.startsWith('https://opengames.dev')) throw new Error('ENOTFOUND')
    return new Response(JSON.stringify(url.includes('/games/veloren') ? { data: { game: raw } } : payload))
  } })
  const [first, duplicate] = await Promise.all([provider.page(), provider.page()])
  assert.deepEqual(first, duplicate)
  assert.equal(first.nextPage, 2)
  assert.equal(first.total, 101)
  assert.equal(calls.length, 2)
  assert.equal(provider.endpoint, 'https://www.open-source-games.com/api')
  await provider.page()
  assert.equal(calls.length, 2)
  assert.equal((await provider.detail('veloren')).title, 'Veloren')
  assert.equal(calls.length, 3)
})
test('OpenGames: errores HTTP, respuestas HTML y paginación incorrecta', async () => {
  const limited = createOpenGames({ fetcher: async () => new Response('{}', { status: 429 }) })
  await assert.rejects(limited.page(), error => error.status === 429)
  const invalid = createOpenGames({ fetcher: async () => new Response('<html>error</html>') })
  await assert.rejects(invalid.page(), /catálogo guardado/)
  const malformed = createOpenGames({ fetcher: async () => new Response(JSON.stringify({ data: { games: [] } })) })
  await assert.rejects(malformed.page(), /paginación/)
})
test('Sincronización completa, sin duplicados y conservación en errores', async () => {
  const imported = new Map()
  const calls = []
  const commerce = { games: () => [...imported.values()], importOpenGames: games => games.forEach(game => imported.set(game.id, game)) }
  const provider = { configured: true, endpoint: 'test', page: async page => {
    calls.push(page)
    return { games: [normalizeGame({ ...raw, slug: 'game-' + page })], total: 2, nextPage: page === 1 ? 2 : null }
  } }
  const sync = createOpenGamesSync(provider, commerce, { delay: 0 })
  await Promise.all([sync.initialize(), sync.initialize()])
  assert.deepEqual(calls, [1, 2])
  assert.equal(sync.state.imported, 2)
  assert.equal(sync.state.syncing, false)
  assert.equal(sync.state.nextPage, null)
  await sync.initialize()
  assert.deepEqual(calls, [1, 2])
  const failed = createOpenGamesSync({ configured: true, page: async () => { throw new Error('offline') } }, commerce)
  await failed.initialize()
  assert.equal(failed.state.error, 'offline')
  assert.equal(imported.size, 2)
})
