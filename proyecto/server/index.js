import { createServer } from 'node:http'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const directory = process.env.AUTH_DATA_DIR || fileURLToPath(new URL('./data/', import.meta.url))
mkdirSync(directory, { recursive: true })
const file = resolve(directory, 'users.json')
const sessions = new Map()
const attempts = new Map()
const lifetime = 8 * 60 * 60 * 1000
const publicUser = ({ id, name, email, role, createdAt }) => ({ id, name, email, role, createdAt })
function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
function matches(password, stored) {
  return timingSafeEqual(Buffer.from(passwordHash(password, stored.split(':')[0])), Buffer.from(stored))
}
let users = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
function save() {
  writeFileSync(`${file}.tmp`, JSON.stringify(users, null, 2), { mode: 0o600 })
  renameSync(`${file}.tmp`, file)
}
if (!users.some(user => user.role === 'admin')) {
  const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString('base64url')
  users.push({ id: randomUUID(), name: 'Administrador', email: process.env.ADMIN_EMAIL || 'admin@nexusgames.com', role: 'admin', password: passwordHash(password), createdAt: new Date().toISOString() })
  save()
  if (!process.env.ADMIN_PASSWORD) console.log(`Contraseña inicial del administrador: ${password}`)
}
const dummyHash = passwordHash(randomBytes(24).toString('hex'))
function reply(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(data))
}
async function body(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (Buffer.byteLength(raw) > 8192) throw new Error('Solicitud demasiado grande.')
  }
  try { return JSON.parse(raw) } catch { throw new Error('Solicitud inválida.') }
}
function setSession(res, user) {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { userId: user.id, expires: Date.now() + lifetime })
  res.setHeader('Set-Cookie', `nexus_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${lifetime / 1000}${process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''}`)
}
setInterval(() => {
  for (const [key, value] of sessions) if (value.expires < Date.now()) sessions.delete(key)
  for (const [key, value] of attempts) if (value.expires < Date.now()) attempts.delete(key)
}, 60000).unref()

export const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname
    if (req.method === 'POST' && req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) return reply(res, 403, { error: 'Origen no permitido.' })
    const token = /(?:^|;\s*)nexus_session=([^;]+)/.exec(req.headers.cookie || '')?.[1]
    const session = sessions.get(token)
    const user = session?.expires > Date.now() ? users.find(item => item.id === session.userId) : null
    if (req.method === 'GET' && path === '/api/auth/me') return reply(res, 200, { user: user ? publicUser(user) : null })
    if (req.method === 'POST' && path === '/api/auth/logout') {
      sessions.delete(token)
      res.setHeader('Set-Cookie', 'nexus_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
      return reply(res, 200, { user: null })
    }
    if (req.method === 'GET' && path === '/api/admin/users') {
      if (user?.role !== 'admin') return reply(res, user ? 403 : 401, { error: 'Se requiere una sesión de administrador.' })
      return reply(res, 200, { users: users.map(publicUser) })
    }
    if (req.method === 'POST' && ['/api/auth/register', '/api/auth/login', '/api/auth/admin-login'].includes(path)) {
      const key = req.socket.remoteAddress
      let limit = attempts.get(key)
      if (!limit || limit.expires < Date.now()) { limit = { count: 0, expires: Date.now() + 60000 }; attempts.set(key, limit) }
      if (++limit.count > 20) return reply(res, 429, { error: 'Demasiados intentos. Espera un minuto.' })
      const data = await body(req)
      const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : ''
      const password = data?.password
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length > 128 || password.length < 8) return reply(res, 400, { error: 'Ingresa un correo válido y una contraseña de 8 a 128 caracteres.' })
      let account = users.find(item => item.email === email)
      if (path.endsWith('/register')) {
        const name = typeof data.name === 'string' ? data.name.trim() : ''
        if (name.length < 2 || name.length > 80) return reply(res, 400, { error: 'El nombre debe tener entre 2 y 80 caracteres.' })
        if (account) return reply(res, 409, { error: 'Ya existe una cuenta con este correo.' })
        account = { id: randomUUID(), name, email, role: 'client', password: passwordHash(password), createdAt: new Date().toISOString() }
        users.push(account)
        try { save() } catch (error) { users.pop(); throw error }
      } else {
        const validPassword = matches(password, account?.password || dummyHash)
        const role = path.endsWith('/admin-login') ? 'admin' : 'client'
        if (!validPassword || account?.role !== role) return reply(res, 401, { error: 'Correo o contraseña incorrectos para este acceso.' })
      }
      sessions.delete(token)
      setSession(res, account)
      return reply(res, 200, { user: publicUser(account) })
    }
    reply(res, 404, { error: 'Ruta no encontrada.' })
  } catch (error) {
    console.error(error.message)
    reply(res, 400, { error: 'No se pudo procesar la solicitud. Intenta nuevamente.' })
  }
})
if (process.argv[1] && resolve(process.argv[1]) === resolve(dirname(fileURLToPath(import.meta.url)), 'index.js')) {
  server.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => console.log('API de cuentas: http://127.0.0.1:3001'))
}
