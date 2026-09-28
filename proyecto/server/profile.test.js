import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createProfiles } from './profile.js'
import { createCommerce } from './commerce.js'

test('Perfil: autorización, biblioteca, horas, amigos, foto y persistencia', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-profile-test-'))
  process.env.AUTH_DATA_DIR = directory
  process.env.OPENGAMES_API_URL = ''
  process.env.ADMIN_EMAIL = 'admin@test.com'
  process.env.ADMIN_PASSWORD = 'Admin-profile-test123!'
  process.env.N8N_REGISTRATION_URL = ''
  process.env.N8N_PURCHASE_URL = ''
  const { server } = await import('./index.js')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  async function request(path, data, cookie) {
    const response = await fetch(base + path, {
      method: data === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    })
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
  }
  try {
    const first = await request('/auth/register', { name: 'Cliente Uno', email: 'one@test.com', password: 'Password-123!' })
    const second = await request('/auth/register', { name: 'Cliente Dos', email: 'two@test.com', password: 'Password-123!' })
    const admin = await request('/auth/admin-login', { email: 'admin@test.com', password: process.env.ADMIN_PASSWORD })
    assert.equal((await request('/profile')).status, 401)
    assert.equal((await request('/profile', { action: 'avatar', avatar: '' })).status, 401)
    assert.equal((await request('/profile', undefined, admin.cookie)).status, 403)
    const game = createCommerce(directory).games().find(item => item.price != null && !item.isUpcoming)
    await request('/orders', { requestId: randomUUID(), gameId: game.id, expectedPrice: game.price }, first.cookie)
    await request('/wishlist', { gameId: game.id, saved: true }, first.cookie)
    const profile = (await request('/profile', undefined, first.cookie)).data
    assert.equal(profile.games.length, 1)
    assert.equal(profile.games[0].purchased, true)
    assert.equal(profile.games[0].saved, true)
    assert.equal(profile.games[0].hours, 0)
    const post = data => request('/profile', data, first.cookie)
    assert.equal((await post({ action: 'hours', gameId: 'missing', hours: 2 })).status, 403)
    for (const hours of [-1, '3', null, 100001]) assert.equal((await post({ action: 'hours', gameId: game.id, hours })).status, 400)
    assert.equal((await post({ action: 'hours', gameId: game.id, hours: 12.5 })).data.games[0].hours, 12.5)
    assert.equal((await request('/profile', { action: 'hours', gameId: game.id, hours: 4 }, second.cookie)).status, 403)
    assert.equal((await post({ action: 'add-friend', friendId: first.data.user.id })).status, 400)
    assert.equal((await post({ action: 'add-friend', friendId: 'missing' })).status, 404)
    await post({ action: 'add-friend', friendId: second.data.user.id })
    const friends = (await post({ action: 'add-friend', friendId: second.data.user.id })).data.friends
    assert.equal(friends.length, 1)
    assert.deepEqual(Object.keys(friends[0]).sort(), ['avatar', 'id', 'name'])
    const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII='
    assert.equal((await post({ action: 'avatar', avatar })).data.avatar, avatar)
    assert.equal((await post({ action: 'avatar', avatar: 'data:image/svg+xml;base64,PHN2Zz4=' })).status, 400)
    assert.equal((await post({ action: 'avatar', avatar: 'data:image/png;base64,AAAA' })).status, 400)
    assert.equal((await post({ action: 'avatar', avatar: 'x'.repeat(420000) })).status, 413)
    // Saving the in-memory auth users must not overwrite profile records.
    await request('/auth/register', { name: 'Cliente Tres', email: 'three@test.com', password: 'Password-123!' })
    const persisted = createProfiles(directory).read(first.data.user.id)
    assert.equal(persisted.avatar, avatar)
    assert.equal(persisted.games[0].hours, 12.5)
    assert.equal(persisted.friends.length, 1)
    assert.deepEqual((await request('/profile', undefined, second.cookie)).data, { avatar: '', banner: '', imageEdits: {}, games: [], friends: [] })
    assert.equal((await post({ action: 'remove-friend', friendId: second.data.user.id })).data.friends.length, 0)
    assert.equal((await post({ action: 'avatar', avatar: '' })).data.avatar, '')
  } finally {
    await new Promise(resolve => server.close(resolve))
    const target = resolve(directory)
    assert.equal(dirname(target), resolve(tmpdir()))
    assert.ok(basename(target).startsWith('nexus-profile-test-'))
    rmSync(target, { recursive: true, force: true })
  }
})
