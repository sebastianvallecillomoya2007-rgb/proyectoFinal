import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { createDatabase } from './database.js'
import { createSessions } from './sessions.js'

test('JSON Server: CRUD de cinco recursos, permisos y persistencia compartida', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-admin-test-'))
  process.env.AUTH_DATA_DIR = directory
  process.env.OPENGAMES_API_URL = ''
  process.env.ADMIN_EMAIL = 'admin@test.com'
  process.env.ADMIN_PASSWORD = 'Test-admin-927!'
  process.env.N8N_REGISTRATION_URL = ''
  process.env.N8N_PURCHASE_URL = ''
  const { server } = await import('./index.js')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  let cookie = ''
  async function call(path, method = 'GET', data, headers = {}) {
    const res = await fetch(base + path, { method, headers: { Cookie: cookie, 'Content-Type': 'application/json', ...headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) })
    return { status: res.status, data: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0] }
  }
  const endpoint = (resource, id = '') => '/admin/resources/' + resource + (id ? '/' + id : '')
  try {
    assert.equal((await call(endpoint('games'))).status, 401)
    const client = await call('/auth/register', 'POST', { name: 'Cliente', email: 'client@test.com', password: 'Password-123!' })
    cookie = client.cookie
    assert.equal((await call(endpoint('games'), 'POST', {})).status, 403)
    cookie = (await call('/auth/admin-login', 'POST', { email: 'admin@test.com', password: 'Test-admin-927!' })).cookie
    const createdUser = await call(endpoint('users'), 'POST', { name: 'Nuevo cliente', email: 'new@test.com', role: 'client', password: 'Password-123!' })
    assert.equal(createdUser.status, 201)
    assert.equal(createdUser.data.password, undefined)
    const user = createdUser.data
    assert.equal((await call(endpoint('users', user.id), 'PATCH', { name: 'Cliente actualizado' })).data.name, 'Cliente actualizado')
    assert.equal((await call(endpoint('users') + '?_expand=password')).status, 400)
    assert.equal((await call(endpoint('sessions'))).status, 404)
    assert.equal((await call('/admin/resources/db')).status, 404)
    const gameData = { title: 'Juego CRUD', category: 'indie', basePrice: 10, price: 10, isOffer: false, isUpcoming: false, image: '', description: 'Juego de prueba' }
    const createdGame = await call(endpoint('games'), 'POST', gameData)
    assert.equal(createdGame.status, 201)
    const game = createdGame.data
    assert.equal((await call(endpoint('games', game.id), 'PATCH', { basePrice: 12, image: 'https://example.com/game.jpg' })).data.price, 12)
    assert.equal((await call(endpoint('games', game.id), 'PATCH', { basePrice: -1 })).status, 400)
    assert.equal((await call(endpoint('games', game.id), 'DELETE', undefined, { Origin: 'https://other.test' })).status, 403)
    const refs = { userId: user.id, gameId: game.id }
    const created = {}
    for (const [resource, values] of Object.entries({ orders: { ...refs, quantity: 2 }, wishlist: refs, reviews: { ...refs, rating: 4, text: 'Muy buen juego de prueba' } })) {
      const response = await call(endpoint(resource), 'POST', values)
      assert.equal(response.status, 201, resource + ': ' + JSON.stringify(response.data))
      created[resource] = response.data
      const updated = await call(endpoint(resource, response.data.id), 'PATCH', resource === 'orders' ? { quantity: 3 } : resource === 'reviews' ? { rating: 5 } : { userId: client.data.user.id })
      assert.equal(updated.status, 200)
      assert.ok((await call(endpoint(resource))).data.some(item => item.id === response.data.id))
    }
    assert.equal(created.orders.totalCents, 2400)
    assert.equal((await call(endpoint('games', game.id), 'DELETE')).status, 409)
    assert.equal((await call(endpoint('users', user.id), 'DELETE')).status, 409)
    assert.equal((await call('/admin/sales')).data.units, 3)
    const database = createDatabase(directory)
    assert.ok(database.file.endsWith('db.json'))
    assert.equal(database.read().orders[0].totalCents, 3600)
    assert.match(database.read().users.find(item => item.id === user.id).password, /^[a-f0-9]{32}:[a-f0-9]{128}$/)
    assert.equal((await call('/games')).data.games.find(item => item.id === game.id).price, 12)
    // Una nueva instancia recupera la sesión desde disco; no guarda el token en claro.
    assert.equal(createSessions(createDatabase(directory)).get(cookie.split('=')[1]).userId, database.read().users.find(item => item.role === 'admin').id)
    assert.ok(!JSON.stringify(database.read().sessions).includes(cookie.split('=')[1]))
    for (const resource of ['reviews', 'wishlist', 'orders']) assert.equal((await call(endpoint(resource, created[resource].id), 'DELETE')).status, 200)
    assert.equal((await call(endpoint('games', game.id), 'DELETE')).status, 200)
    assert.equal((await call(endpoint('users', user.id), 'DELETE')).status, 200)
    const ownId = (await call('/auth/me')).data.user.id
    assert.equal((await call(endpoint('users', ownId), 'DELETE')).status, 409)
    assert.equal((await call(endpoint('users', ownId), 'PATCH', { role: 'client' })).status, 409)
    assert.equal(database.read().automationEvents.filter(event => event.type === 'order.created').length, 1)
  } finally {
    await new Promise(resolve => server.close(resolve))
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()))
    assert.ok(basename(directory).startsWith('nexus-admin-test-'))
    rmSync(directory, { recursive: true, force: true })
  }
})
