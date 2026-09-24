import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createCommerce } from './commerce.js'

test('ventas, ofertas, rankings, periodos y persistencia', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-commerce-test-'))
  process.env.AUTH_DATA_DIR = directory
  process.env.RAWG_API_KEY = ''
  process.env.ADMIN_EMAIL = 'admin@test.com'
  process.env.ADMIN_PASSWORD = 'Test-admin-927!'
  const { server } = await import('./index.js')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  async function request(path, data, cookie) {
    const response = await fetch(base + path, { method: data ? 'POST' : 'GET', headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) })
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
  }
  try {
    const client = await request('/auth/register', { name: 'Cliente', email: 'client@test.com', password: 'Cliente123!' })
    const admin = await request('/auth/admin-login', { email: 'admin@test.com', password: 'Test-admin-927!' })
    const price = { basePrice: 20, isOffer: true, offerPrice: 10 }
    assert.equal((await request('/admin/sales')).status, 401)
    assert.equal((await request('/admin/sales', null, client.cookie)).status, 403)
    assert.equal((await request('/admin/games/1/price', price, client.cookie)).status, 403)
    assert.equal((await request('/admin/games/1/price', price)).status, 401)
    const empty = (await request('/admin/sales', null, admin.cookie)).data
    assert.equal(empty.purchases, 0)
    assert.equal(empty.revenueCents, 0)
    assert.equal(empty.bestSellers.length, 0)
    assert.ok(empty.leastSellers.every(game => game.units === 0 && game.id !== '4'))
    for (const invalid of [-1, 1.234, '10', null, 100001]) {
      assert.equal((await request('/admin/games/1/price', { ...price, basePrice: invalid }, admin.cookie)).status, 400)
    }
    assert.equal((await request('/admin/games/1/price', { ...price, offerPrice: 20 }, admin.cookie)).status, 400)
    assert.equal((await request('/admin/games/1/price', { ...price, offerPrice: -1 }, admin.cookie)).status, 400)
    assert.equal((await request('/admin/games/missing/price', price, admin.cookie)).status, 404)
    assert.equal((await request('/admin/games/1/price', price, admin.cookie)).status, 200)
    const game = (await request('/games')).data.games.find(game => game.id === '1')
    assert.equal(game.price, 10)
    assert.equal(game.oldPrice, 20)
    assert.equal(game.discount, '-50%')
    const order = { gameId: '1', expectedPrice: 10, requestId: randomUUID(), totalCents: 1 }
    assert.equal((await request('/orders', order)).status, 401)
    assert.equal((await request('/orders', order, admin.cookie)).status, 403)
    assert.equal((await request('/orders', { ...order, expectedPrice: 12.39 }, client.cookie)).status, 409)
    assert.equal((await request('/orders', { ...order, gameId: '4' }, client.cookie)).status, 400)
    const purchase = await request('/orders', order, client.cookie)
    assert.equal(purchase.status, 200)
    assert.equal(purchase.data.order.totalCents, 1000)
    assert.equal((await request('/orders', order, client.cookie)).data.order.id, purchase.data.order.id)
    assert.equal((await request('/orders', { ...order, gameId: '2' }, client.cookie)).status, 409)
    await request('/orders', { ...order, requestId: randomUUID() }, client.cookie)
    await request('/orders', { gameId: '2', expectedPrice: 5.8, requestId: randomUUID() }, client.cookie)
    const report = (await request('/admin/sales', null, admin.cookie)).data
    assert.equal(report.purchases, 3)
    assert.equal(report.units, 3)
    assert.equal(report.revenueCents, 2580)
    assert.equal(report.averageCents, 860)
    assert.equal(report.buyers, 1)
    assert.equal(report.bestSellers[0].id, '1')
    assert.equal(report.bestSellers[0].units, 2)
    assert.equal(report.leastSellers[0].units, 0)
    assert.ok(report.leastSellers.every(game => game.id !== '4'))
    assert.equal((await request('/admin/sales?period=bad', null, admin.cookie)).status, 400)
    const removed = await request('/admin/games/1/price', { basePrice: 25, isOffer: false }, admin.cookie)
    assert.equal(removed.data.game.price, 25)
    assert.equal(removed.data.game.oldPrice, null)
    assert.equal(removed.data.game.discount, null)
    assert.equal((await request('/admin/sales', null, admin.cookie)).data.revenueCents, 2580)
    const reloaded = createCommerce(directory)
    assert.equal(reloaded.games().find(game => game.id === '1').price, 25)
    assert.equal(reloaded.report().purchases, 3)
    const file = join(directory, 'commerce.json')
    const stored = JSON.parse(readFileSync(file, 'utf8'))
    stored.orders[0].createdAt = new Date(Date.now() - 40 * 86400000).toISOString()
    writeFileSync(file, JSON.stringify(stored))
    const historical = createCommerce(directory)
    assert.equal(historical.report('7').purchases, 2)
    assert.equal(historical.report('30').revenueCents, 1580)
    assert.equal(historical.report('all').revenueCents, 2580)
  } finally {
    await new Promise(resolve => server.close(resolve))
    const cleanupPath = resolve(directory)
    assert.equal(dirname(cleanupPath), resolve(tmpdir()))
    assert.ok(basename(cleanupPath).startsWith('nexus-commerce-test-'))
    rmSync(cleanupPath, { recursive: true, force: true })
  }
})
