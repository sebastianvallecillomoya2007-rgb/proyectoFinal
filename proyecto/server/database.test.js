import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { createDatabase } from './database.js'
import { createCommerce } from './commerce.js'
import { createCommunity } from './community.js'

function temporary(t) {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-database-test-'))
  t.after(() => {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()))
    assert.ok(basename(directory).startsWith('nexus-database-test-'))
    rmSync(directory, { recursive: true, force: true })
  })
  return directory
}

test('Migra las cinco colecciones sin modificar los archivos anteriores', t => {
  const directory = temporary(t)
  const game = { id: 'legacy', title: 'Juego guardado', categories: ['rpg'], price: 12, basePrice: 12 }
  const user = { id: 'user-1', name: 'Cliente', password: 'hash-conservado' }
  const order = { id: 'order-1', gameId: game.id, totalCents: 1200 }
  const review = { id: 'review-1', userId: user.id, gameId: game.id, text: 'Una reseña existente', rating: 4, updatedAt: '2026-01-01' }
  const wishlist = { userId: user.id, gameId: game.id }
  const legacy = { 'commerce.json': { games: [game], orders: [order] }, 'users.json': [user], 'community.json': { wishlist: [wishlist], reviews: [review] } }
  for (const [name, data] of Object.entries(legacy)) writeFileSync(join(directory, name), JSON.stringify(data))
  const database = createDatabase(directory)
  assert.deepEqual(database.read(), { games: [game], users: [user], orders: [order], wishlist: [wishlist], reviews: [review] })
  for (const [name, data] of Object.entries(legacy)) assert.deepEqual(JSON.parse(readFileSync(join(directory, name), 'utf8')), data)
  database.update(current => ({ ...current, users: [...current.users, { id: 'new-user' }] }))
  assert.equal(createDatabase(directory).read().users.length, 2)
})

test('Juegos, usuarios, ventas y comunidad comparten bd.json sin perder cambios', t => {
  const directory = temporary(t)
  const database = createDatabase(directory)
  const commerce = createCommerce(directory)
  const community = createCommunity(directory, commerce)
  const user = { id: 'client', name: 'Cliente', email: 'test@example.test', password: 'hash' }
  database.update(current => ({ ...current, users: [user] }))
  commerce.updatePrice('1', { basePrice: 25, isOffer: false })
  community.setWishlist(user.id, { gameId: '1', saved: true })
  commerce.importOpenGames([{ id: 'opengames-example', title: 'Example', categories: ['rpg'] }])
  community.review(user, '1', { rating: 5, text: 'Una experiencia muy entretenida.' })
  const order = commerce.purchase(user, { gameId: '1', expectedPrice: 25, requestId: '11111111-1111-1111-1111-111111111111' })
  database.update(current => ({ ...current, users: [...current.users, { id: 'second' }] }))
  const stored = JSON.parse(readFileSync(join(directory, 'bd.json'), 'utf8'))
  assert.equal(stored.users.length, 2)
  assert.equal(stored.games.find(game => game.id === '1').price, 25)
  assert.ok(stored.games.some(game => game.id === 'opengames-example'))
  assert.equal(stored.orders[0].id, order.id)
  assert.equal(stored.wishlist.length, 1)
  assert.equal(stored.reviews.length, 1)
  const reloadedCommerce = createCommerce(directory)
  const reloadedCommunity = createCommunity(directory, reloadedCommerce)
  assert.equal(reloadedCommunity.wishlist(user.id).length, 1)
  assert.equal(reloadedCommunity.reviews('1', user.id)[0].rating, 5)
  assert.equal(reloadedCommerce.report().purchases, 1)
  for (const name of ['users.json', 'commerce.json', 'community.json', 'bd.json.tmp']) assert.equal(existsSync(join(directory, name)), false)
})

test('Una base inválida no se reemplaza ni se reinicializa silenciosamente', t => {
  const directory = temporary(t)
  const file = join(directory, 'bd.json')
  writeFileSync(file, '{broken')
  assert.throws(() => createDatabase(directory))
  assert.equal(readFileSync(file, 'utf8'), '{broken')
  writeFileSync(file, JSON.stringify({ games: [] }))
  assert.throws(() => createDatabase(directory), /bd.json/)
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), { games: [] })
})
