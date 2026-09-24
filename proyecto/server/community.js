import { createDatabase } from './database.js'
import { randomUUID } from 'node:crypto'

const fail = (status, message) => { throw Object.assign(new Error(message), { status }) }

export function createCommunity(directory, commerce) {
  const database = createDatabase(directory)
  const findGame = id => {
    const game = commerce.games().find(item => item.id === id)
    if (!game) fail(404, 'Juego no encontrado.')
    return game
  }
  const commit = next => database.update(current => ({ ...current, wishlist: next.wishlist, reviews: next.reviews }))
  return {
    wishlist(userId) {
      const state = database.read()
      const ids = new Set(state.wishlist.filter(item => item.userId === userId).map(item => item.gameId))
      return commerce.games().filter(game => ids.has(game.id))
    },
    setWishlist(userId, data) {
      const state = database.read()
      findGame(data?.gameId)
      if (typeof data.saved !== 'boolean') fail(400, 'Indica si deseas guardar el juego.')
      const wishlist = state.wishlist.filter(item => item.userId !== userId || item.gameId !== data.gameId)
      if (data.saved) wishlist.push({ userId, gameId: data.gameId })
      commit({ ...state, wishlist })
      return { saved: data.saved }
    },
    reviews(gameId, userId) {
      const state = database.read()
      return state.reviews.filter(item => item.gameId === gameId).map(({ userId: authorId, ...review }) => ({ ...review, own: authorId === userId })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    review(user, gameId, data) {
      const state = database.read()
      findGame(gameId)
      const text = typeof data?.text === 'string' ? data.text.trim() : ''
      if (!Number.isInteger(data?.rating) || data.rating < 1 || data.rating > 5 || text.length < 10 || text.length > 2000) fail(400, 'Escribe entre 10 y 2000 caracteres y elige de 1 a 5 estrellas.')
      const previous = state.reviews.find(item => item.userId === user.id && item.gameId === gameId)
      const review = { id: previous?.id || randomUUID(), userId: user.id, author: user.name, gameId, rating: data.rating, text, updatedAt: new Date().toISOString() }
      commit({ ...state, reviews: [...state.reviews.filter(item => item !== previous), review] })
      return this.reviews(gameId, user.id)
    },
  }
}
