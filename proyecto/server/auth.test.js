import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'

test('registro, sesiones, separación de roles y persistencia', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'nexus-auth-test-'))
  process.env.AUTH_DATA_DIR = directory
  process.env.RAWG_API_KEY = ''
  process.env.ADMIN_EMAIL = 'admin@test.com'
  process.env.ADMIN_PASSWORD = 'Test-admin-927!'
  const { server } = await import('./index.js')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  async function request(path, data, cookie, origin) {
    const response = await fetch(`${base}/api${path}`, {
      method: data ? 'POST' : 'GET',
      headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) },
      ...(data ? { body: JSON.stringify(data) } : {}),
    })
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], cookieHeader: response.headers.get('set-cookie') }
  }
  try {
    assert.equal((await request('/admin/users')).status, 401)
    assert.equal((await request('/auth/me')).data.user, null)
    assert.equal((await request('/auth/register', { email: 'bad', password: 'x' })).status, 400)
    const client = { name: 'Cliente Prueba', email: ' CLIENTE@test.com ', password: 'Cliente-987!', role: 'admin' }
    const registration = await request('/auth/register', client)
    assert.equal(registration.status, 200)
    assert.equal(registration.data.user.role, 'client')
    assert.equal(registration.data.user.email, 'cliente@test.com')
    assert.equal(registration.data.user.password, undefined)
    assert.match(registration.cookieHeader, /HttpOnly/)
    assert.match(registration.cookieHeader, /SameSite=Strict/)
    assert.equal((await request('/auth/me', null, registration.cookie)).data.user.name, client.name)
    assert.equal((await request('/auth/register', client)).status, 409)
    assert.equal((await request('/admin/users', null, registration.cookie)).status, 403)
    assert.equal((await request('/auth/admin-login', client)).status, 401)
    assert.equal((await request('/auth/login', { ...client, password: 'incorrecta' })).status, 401)
    const login = await request('/auth/login', client)
    assert.equal(login.status, 200)
    assert.equal((await request('/auth/logout', {}, login.cookie)).status, 200)
    assert.equal((await request('/auth/me', null, login.cookie)).data.user, null)
    const admin = { email: 'admin@test.com', password: 'Test-admin-927!' }
    assert.equal((await request('/auth/login', admin)).status, 401)
    const adminLogin = await request('/auth/admin-login', admin)
    assert.equal(adminLogin.status, 200)
    const list = await request('/admin/users', null, adminLogin.cookie)
    assert.equal(list.status, 200)
    assert.equal(list.data.users.length, 2)
    assert.ok(list.data.users.every(user => !('password' in user)))
    assert.equal((await request('/auth/logout', {}, adminLogin.cookie, 'https://other.example')).status, 403)
    assert.equal((await request('/auth/logout', {}, adminLogin.cookie, base)).status, 200)
    assert.equal((await request('/admin/users', null, adminLogin.cookie)).status, 401)
    const stored = JSON.parse(readFileSync(join(directory, 'users.json'), 'utf8'))
    assert.equal(stored.length, 2)
    assert.ok(stored.every(user => /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(user.password)))
    assert.ok(!JSON.stringify(stored).includes(client.password))
  } finally {
    await new Promise(resolve => server.close(resolve))
    const cleanupPath = resolve(directory)
    assert.equal(dirname(cleanupPath), resolve(tmpdir()))
    assert.ok(basename(cleanupPath).startsWith('nexus-auth-test-'))
    rmSync(cleanupPath, { recursive: true, force: true })
  }
})
