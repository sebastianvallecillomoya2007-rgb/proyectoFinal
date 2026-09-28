import './env.js'
import { createServer } from 'node:http'
import { randomBytes, randomUUID } from 'node:crypto'
import { createDatabase, defaultDirectory } from './database.js'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { createCommerce } from './commerce.js'
import { createOpenGames, createOpenGamesSync } from './opengames.js'
import { createCommunity } from './community.js'
import { createProfiles } from './profile.js'
import { passwordHash, matches, publicUser } from './passwords.js'
import { createSessions } from './sessions.js'
import { createAdminResources } from './admin-resources.js'
import { createAutomations } from './automations.js'
import { fetchExternalGames } from '../src/service/externalGamesService.js'

const directory = process.env.AUTH_DATA_DIR || defaultDirectory
const database = createDatabase(directory)
const commerce = createCommerce(directory)
const openGames = createOpenGames({ baseUrl: process.env.OPENGAMES_API_URL ?? process.env.VITE_API_URL, fallbackUrl: process.env.OPENGAMES_FALLBACK_URL, fetcher: fetchExternalGames })
const catalogSync = createOpenGamesSync(openGames, commerce)
const community = createCommunity(directory, commerce)
const profiles = createProfiles(directory)
const sessions = createSessions(database)
const automations = createAutomations(database)
const adminResources = createAdminResources(database, automations.enqueue)
const attempts = new Map()
const lifetime = 8 * 60 * 60 * 1000
let users = database.read().users
function save() {
  database.update(current => ({ ...current, users }))
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
async function body(req, maxBytes = 8192) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (Buffer.byteLength(raw) > maxBytes) throw Object.assign(new Error('Solicitud demasiado grande.'), { status: 413 })
  }
  try { return JSON.parse(raw) } catch { throw new Error('Solicitud inválida.') }
}
function setSession(res, user) {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { userId: user.id, expires: Date.now() + lifetime })
  res.setHeader('Set-Cookie', `nexus_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${lifetime / 1000}${process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''}`)
}
setInterval(() => {
  sessions.prune()
  void automations.flush()
  for (const [key, value] of attempts) if (value.expires < Date.now()) attempts.delete(key)
}, 60000).unref()

export const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) return reply(res, 403, { error: 'Origen no permitido.' })
    users = database.read().users
    const token = /(?:^|;\s*)nexus_session=([^;]+)/.exec(req.headers.cookie || '')?.[1]
    const session = sessions.get(token)
    const user = session?.expires > Date.now() ? users.find(item => item.id === session.userId) : null
    if (path.startsWith('/api/admin/') && user?.role !== 'admin') return reply(res, user ? 403 : 401, { error: 'Se requiere una sesión de administrador.' })
    if (path.startsWith('/api/admin/resources/')) {
      req.actor = user
      req.url = req.url.slice('/api/admin/resources'.length)
      return adminResources(req, res)
    }
    if (path === '/api/admin/automations' && req.method === 'GET') return reply(res, 200, automations.status())
    if (path === '/api/admin/automations/retry' && req.method === 'POST') return reply(res, 200, await automations.retry())
    if (path === '/api/profile' && ['GET', 'POST'].includes(req.method)) {
      if (user?.role !== 'client') return reply(res, user ? 403 : 401, { error: 'Inicia sesión como cliente para ver tu perfil.' })
      return reply(res, 200, req.method === 'GET' ? profiles.read(user.id) : profiles.update(user.id, await body(req, 1500000)))
    }
    if (req.method === 'GET' && path === '/api/games') {
      void catalogSync.initialize()
      return reply(res, 200, { games: commerce.games(), catalog: catalogSync.state })
    }
    if (req.method === 'GET' && path === '/api/platforms') return reply(res, 200, { platforms: [...new Map(commerce.games().flatMap(game => game.platforms || []).map(item => [item.id, item])).values()] })
    if (path === '/api/wishlist' && ['GET', 'POST'].includes(req.method)) {
      if (!user) return reply(res, 401, { error: 'Inicia sesión para guardar tus juegos.' })
      return reply(res, 200, req.method === 'GET' ? { games: community.wishlist(user.id) } : community.setWishlist(user.id, await body(req)))
    }
    if (req.method === 'POST' && /^\/api\/games\/[^/]+\/reviews$/.test(path)) {
      if (user?.role !== 'client') return reply(res, user ? 403 : 401, { error: 'Inicia sesión como cliente para publicar una reseña.' })
      return reply(res, 200, { reviews: community.review(user, decodeURIComponent(path.split('/')[3]), await body(req)) })
    }
    if (req.method === 'GET' && /^\/api\/games\/[^/]+$/.test(path)) {
      const id = decodeURIComponent(path.split('/')[3])
      let game = commerce.games().find(item => item.id === id)
      if (!game) return reply(res, 404, { error: 'Juego no encontrado. Abre el catálogo para actualizar los juegos disponibles.' })
      let notice = ''
      if (game.source === 'opengames' && openGames.configured) {
        try {
          commerce.importOpenGames([await openGames.detail(game.slug)])
          game = commerce.games().find(item => item.id === id)
        } catch (error) { notice = error.message }
      }
      return reply(res, 200, { game, notice, reviews: community.reviews(id, user?.id), saved: user ? community.wishlist(user.id).some(item => item.id === id) : false })
    }
    if (req.method === 'GET' && path === '/api/admin/sales') return reply(res, 200, commerce.report(url.searchParams.get('period') || 'all'))
    if (req.method === 'POST' && /^\/api\/admin\/games\/[^/]+\/price$/.test(path)) {
      return reply(res, 200, { game: commerce.updatePrice(decodeURIComponent(path.split('/')[4]), await body(req)) })
    }
    if (req.method === 'POST' && path === '/api/orders') {
      if (user?.role !== 'client') return reply(res, user ? 403 : 401, { error: 'Inicia sesión como cliente para comprar.' })
      const order = commerce.purchase(user, await body(req))
      automations.enqueue('orders', order)
      return reply(res, 200, { order })
    }
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
      users = database.read().users
      let account = users.find(item => item.email === email)
      if (path.endsWith('/register')) {
        const name = typeof data.name === 'string' ? data.name.trim() : ''
        if (name.length < 2 || name.length > 80) return reply(res, 400, { error: 'El nombre debe tener entre 2 y 80 caracteres.' })
        if (account) return reply(res, 409, { error: 'Ya existe una cuenta con este correo.' })
        account = { id: randomUUID(), name, email, role: 'client', password: passwordHash(password), createdAt: new Date().toISOString() }
        users.push(account)
        try { save() } catch (error) { users.pop(); throw error }
        automations.enqueue('users', account)
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
    reply(res, error.status || 400, { error: error.status ? error.message : 'No se pudo procesar la solicitud. Intenta nuevamente.' })
  }
})
if (process.argv[1] && resolve(process.argv[1]) === resolve(dirname(fileURLToPath(import.meta.url)), 'index.js')) {
  server.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => console.log('API de cuentas: http://127.0.0.1:3001'))
}
