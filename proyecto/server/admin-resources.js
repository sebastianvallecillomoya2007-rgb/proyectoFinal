import { randomUUID } from 'node:crypto'
import jsonServer from 'json-server'
import low from 'lowdb'
import { passwordHash, publicUser } from './passwords.js'

const resources = ['users', 'games', 'orders', 'wishlist', 'reviews']
const fail = (status, message) => { throw Object.assign(new Error(message), { status }) }
const text = (value, label, min = 1, max = 200) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(400, `${label}: usa entre ${min} y ${max} caracteres.`)
  return value.trim()
}
function price(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) fail(400, 'Precio inválido: usa un número de 0 a 100000, con dos decimales como máximo.')
  return value
}
function reference(state, resource, id) {
  const record = state[resource].find(item => item.id === id)
  if (!record) fail(400, 'Selecciona un ' + (resource === 'users' ? 'usuario' : 'juego') + ' existente.')
  return record
}
function validate(resource, input, old, state, actor) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Formulario inválido.')
  const data = { ...old, ...input }
  const base = { ...old, id: old?.id || randomUUID() }
  if (resource === 'users') {
    const name = text(data.name, 'Nombre', 2, 80)
    const email = text(data.email, 'Correo', 3, 254).toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Correo inválido.')
    if (!['admin', 'client'].includes(data.role)) fail(400, 'Rol inválido.')
    if (state.users.some(item => item.email === email && item.id !== old?.id)) fail(409, 'Ya existe una cuenta con ese correo.')
    if (old?.id === actor.id && data.role !== old.role) fail(409, 'No puedes quitarte tu propio acceso de administrador.')
    if (old?.role === 'admin' && data.role !== 'admin' && state.users.filter(item => item.role === 'admin').length === 1) fail(409, 'Debe permanecer al menos un administrador.')
    let password = old?.password
    if (!old || input.password) password = passwordHash(text(input.password, 'Contraseña', 8, 128))
    return { ...base, name, email, role: data.role, password, createdAt: old?.createdAt || new Date().toISOString() }
  }
  if (resource === 'games') {
    const title = text(data.title, 'Título', 2, 200)
    const category = text(data.category, 'Categoría', 1, 80)
    const basePrice = price(data.basePrice)
    if (typeof data.isOffer !== 'boolean' || typeof data.isUpcoming !== 'boolean') fail(400, 'Indica la disponibilidad y el estado de la oferta.')
    const amount = data.isOffer ? price(data.price) : basePrice
    if (data.isOffer && amount >= basePrice) fail(400, 'La oferta debe ser menor que el precio normal.')
    const image = typeof data.image === 'string' ? data.image.trim() : ''
    if (image && !/^https?:\/\/[^\s]+$/i.test(image)) fail(400, 'La imagen debe ser una dirección HTTP o HTTPS.')
    const description = typeof data.description === 'string' ? data.description.trim() : ''
    if (description.length > 10000) fail(400, 'La descripción no puede superar 10000 caracteres.')
    return { ...base, title, description, category, categories: [...new Set([category, ...(old?.categories || []).filter(value => value !== old?.category)])], image, basePrice, price: amount, isOffer: data.isOffer, isUpcoming: data.isUpcoming, oldPrice: data.isOffer ? basePrice : null, discount: data.isOffer ? `-${Math.round((1 - amount / basePrice) * 100)}%` : null }
  }
  const user = reference(state, 'users', data.userId)
  const game = reference(state, 'games', data.gameId)
  if (user.role !== 'client') fail(400, 'Selecciona una cuenta de cliente.')
  if (resource === 'orders') {
    if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 100) fail(400, 'La cantidad debe ser un entero entre 1 y 100.')
    if (game.isUpcoming || game.price == null) fail(400, 'El juego no está disponible para compras.')
    // El importe viene del catálogo; un formulario no puede inventar cobros.
    const unitPriceCents = old?.gameId === game.id ? old.unitPriceCents : Math.round(price(game.price) * 100)
    return { ...base, requestId: old?.requestId || randomUUID(), userId: user.id, customer: user.name, gameId: game.id, title: game.title, quantity: data.quantity, unitPriceCents, totalCents: unitPriceCents * data.quantity, createdAt: old?.createdAt || new Date().toISOString(), mode: 'demo' }
  }
  if (state[resource].some(item => item.userId === user.id && item.gameId === game.id && item.id !== old?.id)) fail(409, 'El cliente ya tiene un registro para ese juego.')
  if (resource === 'wishlist') return { ...base, userId: user.id, gameId: game.id }
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) fail(400, 'La puntuación debe ser de 1 a 5.')
  return { ...base, userId: user.id, gameId: game.id, author: user.name, rating: data.rating, text: text(data.text, 'Reseña', 10, 2000), updatedAt: new Date().toISOString() }
}

export function createAdminResources(database, onCreated = () => {}) {
  // JSON Server comparte la misma persistencia atómica con cuentas y tienda.
  class Adapter {
    read() {
      const data = database.read()
      this.snapshot = structuredClone(data)
      return data
    }
    write(data) {
      // JSON Server cede el turno antes de escribir. Fusionar por ID conserva
      // compras o sesiones creadas durante esa espera por otros endpoints.
      database.update(current => {
        const next = { ...current }
        for (const resource of resources) {
          const before = new Map((this.snapshot[resource] || []).map(item => [item.id, item]))
          const after = new Map(data[resource].map(item => [item.id, item]))
          const deleted = new Set([...before.keys()].filter(id => !after.has(id)))
          const changed = [...after.values()].filter(item => JSON.stringify(item) !== JSON.stringify(before.get(item.id)))
          const changes = new Map(changed.map(item => [item.id, item]))
          next[resource] = current[resource].filter(item => !deleted.has(item.id)).map(item => changes.get(item.id) || item)
          for (const item of changed) if (!next[resource].some(existing => existing.id === item.id)) next[resource].push(item)
        }
        const remaining = new Set(next.users.map(user => user.id))
        const resetPasswords = new Set(next.users.filter(user => current.users.some(old => old.id === user.id && old.password !== user.password)).map(user => user.id))
        if (next.sessions) next.sessions = next.sessions.filter(session => remaining.has(session.userId) && !resetPasswords.has(session.userId))
        if (next.profiles) next.profiles = next.profiles.filter(profile => remaining.has(profile.userId)).map(profile => ({ ...profile, friends: profile.friends.filter(id => remaining.has(id)) }))
        return next
      })
      this.snapshot = structuredClone(data)
    }
  }
  const router = jsonServer.router(low(new Adapter()))
  const app = jsonServer.create()
  app.use(jsonServer.bodyParser)
  app.use((req, res, next) => {
    try {
      delete req.headers['x-http-method-override']
      const [resource, encodedId, extra] = req.path.slice(1).split('/')
      if (!resources.includes(resource) || extra || !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return res.status(404).json({ error: 'Recurso no encontrado.' })
      // No se permiten expansiones ni consultas a hashes de contraseñas.
      if (Object.keys(req.query).some(key => !['_page', '_limit', '_sort', '_order'].includes(key)) || (req.query._sort && !['title', 'name', 'createdAt', 'id'].includes(req.query._sort))) return res.status(400).json({ error: 'Consulta no permitida.' })
      let state = database.read()
      if (state.wishlist.some(item => !item.id)) {
        database.update(current => ({ ...current, wishlist: current.wishlist.map(item => item.id ? item : { ...item, id: randomUUID() }) }))
        state = database.read()
      }
      const id = encodedId ? decodeURIComponent(encodedId) : null
      const old = id ? state[resource].find(item => item.id === id) : undefined
      if (id && !old) return res.status(404).json({ error: 'Registro no encontrado.' })
      if ((req.method === 'POST' && id) || (['PUT', 'PATCH', 'DELETE'].includes(req.method) && !id)) return res.status(405).json({ error: 'Operación no permitida.' })
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) req.body = validate(resource, req.body, old, state, req.actor)
      if (req.method === 'DELETE') {
        if (resource === 'users' && (old.id === req.actor.id || (old.role === 'admin' && state.users.filter(item => item.role === 'admin').length === 1))) fail(409, 'No puedes eliminar tu cuenta ni el último administrador.')
        if (['users', 'games'].includes(resource)) {
          const key = resource === 'users' ? 'userId' : 'gameId'
          if (['orders', 'wishlist', 'reviews'].some(collection => state[collection].some(item => item[key] === id))) fail(409, 'Este registro tiene compras, deseados o reseñas. Gestiona primero esos registros relacionados.')
        }
      }
      router.db.read()
      req.resourceName = resource
      next()
    } catch (error) { res.status(error.status || 400).json({ error: error.message }) }
  })
  router.render = (req, res) => {
    const data = res.locals.data
    if (req.method === 'POST' && res.statusCode < 400) onCreated(req.resourceName, data)
    if (req.resourceName === 'users') {
      res.json(Array.isArray(data) ? data.map(publicUser) : data?.id ? publicUser(data) : data)
    } else res.json(data)
  }
  app.use(router)
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    res.status(error.status || 400).json({ error: 'No se pudo guardar el registro.' })
  })
  return app
}
