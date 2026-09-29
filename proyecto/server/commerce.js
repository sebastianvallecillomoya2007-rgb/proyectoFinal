import { createDatabase } from './database.js'
import { randomUUID } from 'node:crypto'
import { keepCatalogGame } from './catalog-policy.js'

function fail(status, message) {
  throw Object.assign(new Error(message), { status })
}
function cents(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
    fail(400, 'El precio debe estar entre 0 y 100000, con un máximo de dos decimales.')
  }
  return Math.round(value * 100)
}

export function createCommerce(directory) {
  const database = createDatabase(directory)
  const commit = next => database.update(current => ({ ...current, games: next.games, orders: next.orders }))
  return {
    games: () => database.read().games.filter(keepCatalogGame).map(game => ({ ...game, categories: game.categories?.length ? game.categories : [game.category || 'uncategorized'] })),
    importFreeGames(incoming) {
      const state = database.read()
      const games = [...state.games]
      for (const metadata of incoming) {
        const index = games.findIndex(game => game.id === metadata.id)
        const previous = index >= 0 ? games[index] : {}
        const game = { ...previous, ...metadata, description: metadata.fullDescription || previous.fullDescription || metadata.description, price: 0, basePrice: 0, oldPrice: null, isOffer: false, discount: null }
        if (index >= 0) games[index] = game
        else games.push(game)
      }
      if (JSON.stringify(games) !== JSON.stringify(state.games)) commit({ ...state, games })
    },
    importOpenGames(incoming) {
      const state = database.read()
      const games = [...state.games]
      for (const metadata of incoming) {
        const index = games.findIndex(game => game.id === metadata.id)
        if (!keepCatalogGame({ ...(index >= 0 ? games[index] : {}), ...metadata })) continue
        if (index >= 0) games[index] = { ...games[index], ...metadata }
        else games.push({ price: null, basePrice: null, isOffer: false, oldPrice: null, discount: null, ...metadata })
      }
      if (JSON.stringify(games) !== JSON.stringify(state.games)) commit({ ...state, games })
    },
    importGames(incoming) {
      const state = database.read()
      const games = [...state.games]
      const canonical = title => title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
      for (const metadata of incoming) {
        if (!metadata.image?.trim() && metadata.price !== 0 && metadata.isFreeToPlay !== true) continue
        const index = games.findIndex(game => game.rawgId === metadata.rawgId || (!game.rawgId && canonical(game.title) === canonical(metadata.title)))
        if (!keepCatalogGame({ ...(index >= 0 ? games[index] : { id: `rawg-${metadata.rawgId}` }), ...metadata })) continue
        if (index >= 0) {
          // Los metadatos de RAWG no modifican IDs locales, precios, ofertas ni ventas.
          games[index] = { ...games[index], ...metadata, category: metadata.categories[0] }
        } else {
          games.push({ price: null, basePrice: null, isOffer: false, oldPrice: null, discount: null, ...metadata, id: `rawg-${metadata.rawgId}`, category: metadata.categories[0] })
        }
      }
      if (JSON.stringify(games) !== JSON.stringify(state.games)) commit({ ...state, games })
    },
    updatePrice(id, data) {
      const state = database.read()
      const game = state.games.find(item => item.id === id)
      if (!game) fail(404, 'Juego no encontrado.')
      const base = cents(data?.basePrice)
      if (typeof data?.isOffer !== 'boolean') fail(400, 'Indica si la oferta está activa.')
      const price = data.isOffer ? cents(data.offerPrice) : base
      if (data.isOffer && (base === 0 || price >= base)) fail(400, 'El precio de oferta debe ser menor que el precio normal.')
      const updated = { ...game, basePrice: base / 100, price: price / 100, isOffer: data.isOffer, oldPrice: data.isOffer ? base / 100 : null, discount: data.isOffer ? `-${Math.round((1 - price / base) * 100)}%` : null }
      commit({ ...state, games: state.games.map(item => item.id === id ? updated : item) })
      return updated
    },
    purchase(user, data) {
      const state = database.read()
      if (!/^[a-f0-9-]{36}$/i.test(data?.requestId || '')) fail(400, 'Identificador de compra inválido.')
      const existing = state.orders.find(order => order.userId === user.id && order.requestId === data.requestId)
      if (existing) {
        if (existing.gameId !== data.gameId) fail(409, 'Este identificador ya corresponde a otra compra.')
        return existing
      }
      const game = state.games.find(item => item.id === data.gameId)
      if (!game) fail(404, 'Juego no encontrado.')
      if (game.isUpcoming) fail(400, 'Este juego todavía no está disponible para comprar.')
      if (game.price == null) fail(400, 'Este juego todavía no tiene un precio asignado.')
      if (cents(data.expectedPrice) !== cents(game.price)) fail(409, 'El precio cambió. Actualiza la tienda y vuelve a confirmar la compra.')
      const order = { id: randomUUID(), requestId: data.requestId, userId: user.id, customer: user.name, gameId: game.id, title: game.title, quantity: 1, unitPriceCents: cents(game.price), totalCents: cents(game.price), createdAt: new Date().toISOString(), mode: 'demo' }
      commit({ ...state, orders: [...state.orders, order] })
      return order
    },
    report(period = 'all') {
      const state = database.read()
      if (!['all', '7', '30'].includes(period)) fail(400, 'Periodo inválido.')
      const since = period === 'all' ? 0 : Date.now() - Number(period) * 86400000
      const orders = state.orders.filter(order => Date.parse(order.createdAt) >= since)
      const ranking = state.games.filter(game => !game.isUpcoming).map(game => {
        const sales = orders.filter(order => order.gameId === game.id)
        return { id: game.id, title: game.title, units: sales.reduce((sum, order) => sum + order.quantity, 0), revenueCents: sales.reduce((sum, order) => sum + order.totalCents, 0) }
      })
      const revenueCents = orders.reduce((sum, order) => sum + order.totalCents, 0)
      return {
        period,
        purchases: orders.length,
        units: orders.reduce((sum, order) => sum + order.quantity, 0),
        buyers: new Set(orders.map(order => order.userId)).size,
        revenueCents,
        averageCents: orders.length ? Math.round(revenueCents / orders.length) : 0,
        bestSellers: [...ranking].filter(game => game.units > 0).sort((a, b) => b.units - a.units || a.title.localeCompare(b.title)).slice(0, 5),
        leastSellers: [...ranking].sort((a, b) => a.units - b.units || a.title.localeCompare(b.title)).slice(0, 5),
        recentOrders: [...orders].reverse().slice(0, 20),
      }
    },
  }
}
