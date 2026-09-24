import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { createCommerce } from './commerce.js'
import { createCommunity } from './community.js'
import { normalizeGame } from './opengames.js'

test('Deseados, reseñas, precios y persistencia por usuario', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-community-test-'))
  process.env.AUTH_DATA_DIR = directory
  process.env.OPENGAMES_API_URL = ''
  process.env.ADMIN_EMAIL = 'admin@test.com'
  process.env.ADMIN_PASSWORD = 'Admin-password-123!'
  const commerce = createCommerce(directory)
  const game = normalizeGame({ id: '1', slug: 'test-game', title: 'Test game', genre: 'rpg' })
  commerce.importOpenGames([game])
  assert.equal(commerce.games().find(item => item.id === game.id).price, null)
  commerce.updatePrice(game.id, { basePrice: 15, isOffer: true, offerPrice: 10 })
  commerce.importOpenGames([{ ...game, description: 'Updated' }])
  assert.equal(commerce.games().find(item => item.id === game.id).price, 10)
  const { server } = await import('./index.js')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = 'http://127.0.0.1:' + server.address().port + '/api'
  async function request(path, data, cookie) {
    const response = await fetch(base + path, { method: data ? 'POST' : 'GET', headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) })
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
  }
  try {
    const first = await request('/auth/register', { name: 'Jugador Uno', email: 'one@test.com', password: 'Password-123!' })
    const second = await request('/auth/register', { name: 'Jugador Dos', email: 'two@test.com', password: 'Password-123!' })
    const admin = await request('/auth/admin-login', { email: 'admin@test.com', password: 'Admin-password-123!' })
    assert.equal((await request('/wishlist')).status, 401)
    assert.equal((await request('/wishlist', { gameId: game.id, saved: true })).status, 401)
    assert.equal((await request('/wishlist', { gameId: 'missing', saved: true }, first.cookie)).status, 404)
    assert.equal((await request('/wishlist', { gameId: game.id, saved: 'yes' }, first.cookie)).status, 400)
    await request('/wishlist', { gameId: game.id, saved: true }, first.cookie)
    await request('/wishlist', { gameId: game.id, saved: true }, first.cookie)
    assert.equal((await request('/wishlist', null, first.cookie)).body.games.length, 1)
    assert.equal((await request('/wishlist', null, second.cookie)).body.games.length, 0)
    assert.equal((await request('/games/' + game.id, null, first.cookie)).body.saved, true)
    const path = '/games/' + game.id + '/reviews'
    assert.equal((await request(path, { rating: 5, text: 'Gran juego para disfrutar.' })).status, 401)
    assert.equal((await request(path, { rating: 5, text: 'Gran juego para disfrutar.' }, admin.cookie)).status, 403)
    for (const rating of [0, 6, 1.5, '5']) assert.equal((await request(path, { rating, text: 'Gran juego para disfrutar.' }, first.cookie)).status, 400)
    assert.equal((await request(path, { rating: 5, text: 'breve' }, first.cookie)).status, 400)
    assert.equal((await request(path, { rating: 5, text: ' '.repeat(50) }, first.cookie)).status, 400)
    await request(path, { rating: 5, text: 'Gran juego para disfrutar.' }, first.cookie)
    await request(path, { rating: 4, text: 'Actualizo mi opinión del juego.' }, first.cookie)
    await request(path, { rating: 3, text: 'Una segunda opinión del juego.' }, second.cookie)
    const detail = (await request('/games/' + game.id, null, first.cookie)).body
    assert.equal(detail.reviews.length, 2)
    assert.equal(detail.reviews.filter(item => item.own).length, 1)
    assert.equal(detail.reviews.find(item => item.own).rating, 4)
    assert.ok(detail.reviews.every(item => !('userId' in item)))
    assert.equal((await request('/games/missing')).status, 404)
    assert.equal((await request('/games/' + game.id)).body.reviews.some(item => item.own), false)
    const persisted = createCommunity(directory, commerce)
    assert.equal(persisted.wishlist(first.body.user.id).length, 1)
    assert.equal(persisted.reviews(game.id).length, 2)
    await request('/wishlist', { gameId: game.id, saved: false }, first.cookie)
    assert.equal((await request('/wishlist', null, first.cookie)).body.games.length, 0)
  } finally {
    await new Promise(resolve => server.close(resolve))
    const target = resolve(directory)
    assert.equal(dirname(target), resolve(tmpdir()))
    assert.ok(basename(target).startsWith('nexus-community-test-'))
    rmSync(target, { recursive: true, force: true })
  }
})
