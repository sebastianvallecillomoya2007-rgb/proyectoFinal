import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createRawg, normalizeGame } from './rawg.js'
import { createCommerce } from './commerce.js'
import { matchesCategory } from '../src/categories.js'

const fixture = {
  id: 123, name: 'Elden Ring', slug: 'elden-ring', background_image: 'https://example.com/game.jpg',
  genres: [{ slug: 'action' }, { slug: 'role-playing-games-rpg' }, { slug: 'action' }],
  tags: [{ slug: 'horror' }, { slug: 'sci-fi' }, { slug: 'science-fiction' }],
  platforms: [{ platform: { id: 18, name: 'PlayStation 4' } }], released: '2022-02-25', rating: 4.5,
}
test('categorías múltiples, etiquetas, fechas y campos opcionales', () => {
  const game = normalizeGame(fixture)
  assert.deepEqual(game.categories, ['action', 'rpg', 'horror', 'scifi'])
  for (const category of game.categories) assert.equal(matchesCategory(game, category), true)
  assert.equal(matchesCategory(game, 'racing'), false)
  assert.equal(matchesCategory({ category: 'action' }, 'action'), true)
  assert.equal(game.platforms[0].id, 18)
  assert.equal(normalizeGame({ id: 9, name: 'Sin datos' }).categories[0], 'uncategorized')
  assert.equal(normalizeGame({ ...fixture, released: '2099-01-01' }).isUpcoming, true)
  assert.equal(normalizeGame({ ...fixture, released: '2026-01-01' }, Date.parse('2026-01-15')).isNew, true)
})
test('proxy RAWG: paginación, filtros, caché y clave privada', async () => {
  const requests = []
  const client = createRawg({ key: 'private-test-key', dates: '2019-09-01,2019-09-30', platforms: '18,1,7', fetcher: async url => {
    requests.push(url)
    return { ok: true, json: async () => ({ results: [fixture], count: 100, next: 'https://api.rawg.io/api/games?key=private-test-key&page=2' }) }
  } })
  const [first, second] = await Promise.all([client.games(1), client.games(1)])
  assert.deepEqual(first, second)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].searchParams.get('dates'), '2019-09-01,2019-09-30')
  assert.equal(requests[0].searchParams.get('platforms'), '18,1,7')
  assert.equal(requests[0].searchParams.get('key'), 'private-test-key')
  assert.equal(first.nextPage, 2)
  assert.ok(!JSON.stringify(first).includes('private-test-key'))
  await client.games(1)
  assert.equal(requests.length, 1)
  await client.games(2)
  assert.equal(requests.length, 2)
  await assert.rejects(client.games(-1), { status: 400 })
})
test('clave ausente, fallos, límite de RAWG y lista de plataformas', async () => {
  await assert.rejects(createRawg().games(), { status: 503 })
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(createRawg({ key: 'private-key', fetcher: async () => ({ ok: false, status }) }).games(), error => error.status >= 500 && !error.message.includes('private-key'))
  }
  await assert.rejects(createRawg({ key: 'key', fetcher: async () => { throw Error('secret URL') } }).games(), error => !error.message.includes('secret'))
  await assert.rejects(createRawg({ key: 'key', fetcher: async () => ({ ok: true, json: async () => ({}) }) }).games(), { status: 502 })
  const client = createRawg({ key: 'key', fetcher: async url => ({ ok: true, json: async () => ({ results: [{ id: Number(url.searchParams.get('page')), name: 'Platform' }], next: url.searchParams.get('page') === '1' ? 'next' : null }) }) })
  assert.equal((await client.platforms()).length, 2)
})
test('importar preserva precios, ofertas, IDs y ventas sin duplicar juegos', () => {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-rawg-test-'))
  try {
    const commerce = createCommerce(directory)
    const originalCount = commerce.games().length
    commerce.updatePrice('1', { basePrice: 20, isOffer: true, offerPrice: 10 })
    commerce.purchase({ id: 'client', name: 'Cliente' }, { gameId: '1', expectedPrice: 10, requestId: randomUUID() })
    commerce.importGames([normalizeGame(fixture)])
    commerce.importGames([normalizeGame(fixture)])
    assert.equal(commerce.games().length, originalCount)
    const saved = commerce.games().find(game => game.rawgId === 123)
    assert.equal(saved.id, '1')
    assert.equal(saved.price, 10)
    assert.equal(saved.isOffer, true)
    assert.equal(commerce.report().revenueCents, 1000)
    commerce.importGames([normalizeGame({ ...fixture, id: 1, name: 'Otro juego' })])
    const imported = commerce.games().find(game => game.id === 'rawg-1')
    assert.equal(imported.price, null)
    assert.throws(() => commerce.purchase({ id: 'client' }, { gameId: 'rawg-1', expectedPrice: 0, requestId: randomUUID() }), { status: 400 })
    commerce.updatePrice('rawg-1', { basePrice: 15, isOffer: false })
    commerce.importGames([normalizeGame({ ...fixture, id: 1, name: 'Otro juego actualizado' })])
    assert.equal(commerce.games().find(game => game.id === 'rawg-1').price, 15)
    assert.equal(createCommerce(directory).games().find(game => game.rawgId === 123).categories.length, 4)
  } finally {
    const cleanupPath = resolve(directory)
    assert.equal(dirname(cleanupPath), resolve(tmpdir()))
    assert.ok(basename(cleanupPath).startsWith('nexus-rawg-test-'))
    rmSync(cleanupPath, { recursive: true, force: true })
  }
})
