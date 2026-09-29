import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { createServer } from 'node:http'
import { createFreeToGame, createFreeToGameCatalog, normalizeFreeGame } from './freetogame.js'
import { createCommerce } from './commerce.js'

const sample = { id: 540, title: 'Overwatch', thumbnail: 'https://www.freetogame.com/g/540/thumbnail.jpg', short_description: 'A free hero shooter.', game_url: 'https://www.freetogame.com/open/overwatch', genre: 'Shooter', platform: 'PC (Windows)', publisher: 'Blizzard', developer: 'Blizzard', release_date: '2022-10-04', freetogame_profile_url: 'https://www.freetogame.com/overwatch' }
const detail = { ...sample, description: 'Full description of the game.', screenshots: [{ image: 'https://www.freetogame.com/g/540/shot.jpg' }], minimum_system_requirements: { os: 'Windows 10', processor: 'Core i5', memory: '8 GB', graphics: 'GTX 960', storage: '50 GB' } }

test('FreeToGame: filtros reales, precios cero, seguridad de URL, caché y detalles', async () => {
  const requests = []
  const provider = createFreeToGame({ fetcher: async url => { requests.push(url); return { ok: true, json: async () => url.includes('/game?') ? detail : [sample] } } })
  const filters = { category: 'shooter', platform: 'windows', sortBy: 'alphabetical' }
  const [first, second] = await Promise.all([provider.list(filters), provider.list(filters)])
  assert.deepEqual(first, second)
  assert.equal(requests.length, 1)
  const url = new URL(requests[0])
  assert.equal(url.pathname, '/api/games')
  assert.equal(url.searchParams.get('category'), 'shooter')
  assert.equal(url.searchParams.get('platform'), 'windows')
  assert.equal(url.searchParams.get('sort-by'), 'alphabetical')
  assert.equal(first[0].price, 0)
  assert.equal(first[0].id, 'freetogame-540')
  assert.equal((await provider.detail(540)).requirements.cpu, 'Core i5')
  assert.equal(requests[1], 'https://www.freetogame.com/api/game?id=540')
  assert.equal(normalizeFreeGame({ ...sample, game_url: 'javascript:alert(1)' }).homepage, '')
  assert.throws(() => normalizeFreeGame({ title: 'No ID' }))
  await assert.rejects(provider.list({ category: '../profile' }), /Categoría/)
  await assert.rejects(provider.list({ platform: 'playstation' }), /Plataforma/)
  await assert.rejects(provider.list({ sortBy: 'price' }), /Orden/)
})

test('FreeToGame conserva juegos y precios locales, detalles y respaldo ante fallos', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-free-test-'))
  try {
    const commerce = createCommerce(directory)
    const originals = commerce.games()
    let offline = false
    const provider = { configured: true, list: async () => { if (offline) throw new Error('Sin conexión'); return [normalizeFreeGame(sample)] } }
    const catalog = createFreeToGameCatalog(provider, commerce)
    await catalog.initialize()
    commerce.importFreeGames([normalizeFreeGame(detail)])
    await catalog.list()
    assert.deepEqual(commerce.games().filter(game => game.source !== 'freetogame'), originals)
    assert.equal(commerce.games().length, originals.length + 1)
    const stored = commerce.games().find(game => game.id === 'freetogame-540')
    assert.deepEqual(stored.screenshots, ['https://www.freetogame.com/g/540/shot.jpg'])
    assert.equal(stored.description, detail.description)
    offline = true
    const result = await catalog.list()
    assert.equal(result.games.length, 1)
    assert.match(result.notice, /Sin conexión/)
  } finally {
    if (dirname(resolve(directory)) === resolve(tmpdir()) && basename(directory).startsWith('nexus-free-test-')) rmSync(directory, { recursive: true, force: true })
  }
})

test('FreeToGame rechaza HTML, errores remotos y respuestas malformadas', async () => {
  const broken = createFreeToGame({ fetcher: async () => ({ ok: true, json: async () => { throw new Error('HTML') } }) })
  await assert.rejects(broken.list(), /actualizar FreeToGame/)
  const unavailable = createFreeToGame({ fetcher: async () => ({ ok: false, status: 500 }) })
  await assert.rejects(unavailable.detail(1), /temporalmente/)
  const missing = createFreeToGame({ fetcher: async () => ({ ok: false, status: 404 }) })
  assert.deepEqual(await missing.list({ category: 'moba' }), [])
  await assert.rejects(missing.detail(1), /No se encontraron/)
})

test('FreeToGame integra API, biblioteca de cliente, deseados y ficha directa', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-free-api-'))
  const upstream = createServer((req, res) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(req.url.startsWith('/game?') ? detail : [sample])) })
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve))
  process.env.AUTH_DATA_DIR = directory
  process.env.OPENGAMES_API_URL = ''
  process.env.FREETOGAME_API_URL = `http://127.0.0.1:${upstream.address().port}`
  process.env.ADMIN_EMAIL = 'admin@free.test'
  process.env.ADMIN_PASSWORD = 'Admin-free-test-2026!'
  process.env.N8N_REGISTRATION_URL = ''
  process.env.N8N_PURCHASE_URL = ''
  const { server } = await import('./index.js')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  try {
    const listing = await (await fetch(base + '/freetogame/games?platform=windows&category=shooter&sort-by=release-date')).json()
    assert.equal(listing.games[0].price, 0)
    const game = await (await fetch(base + '/games/freetogame-540')).json()
    assert.equal(game.game.screenshots.length, 1)
    const registration = await fetch(base + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Free Player', email: 'player@free.test', password: 'Player-free-2026!' }) })
    const cookie = registration.headers.get('set-cookie').split(';')[0]
    const saved = await fetch(base + '/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ gameId: 'freetogame-540', saved: true }) })
    assert.equal(saved.status, 200)
    const profile = await (await fetch(base + '/profile', { headers: { Cookie: cookie } })).json()
    assert.equal(profile.games[0].id, 'freetogame-540')
    assert.equal(profile.games[0].price, 0)
  } finally {
    server.closeAllConnections(); upstream.closeAllConnections()
    await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => upstream.close(resolve))])
    if (dirname(resolve(directory)) === resolve(tmpdir()) && basename(directory).startsWith('nexus-free-api-')) rmSync(directory, { recursive: true, force: true })
  }
})
