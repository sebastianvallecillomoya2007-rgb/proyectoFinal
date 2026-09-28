import { createDatabase } from './database.js'

const fail = (status, message) => { throw Object.assign(new Error(message), { status }) }
const emptyProfile = userId => ({ userId, avatar: '', friends: [], hours: {} })

function validateImage(value, limit = 400000) {
  if (typeof value === 'string' && value.length > limit) fail(413, 'La imagen es demasiado grande.')
  if (typeof value !== 'string' || !value || value.length > limit) fail(400, 'La imagen no es válida o es demasiado grande.')
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) fail(400, 'Usa una imagen PNG, JPEG o WebP.')
  const bytes = Buffer.from(match[2], 'base64')
  const valid = match[1] === 'png' ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
    : match[1] === 'jpeg' ? bytes.subarray(0, 3).toString('hex') === 'ffd8ff'
      : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
  if (!valid) fail(400, 'El archivo no es una imagen válida.')
}

export function createProfiles(directory) {
  const database = createDatabase(directory)
  function library(state, userId) {
    const purchased = new Set(state.orders.filter(order => order.userId === userId).map(order => order.gameId))
    const saved = new Set(state.wishlist.filter(item => item.userId === userId).map(item => item.gameId))
    const profile = state.profiles?.find(item => item.userId === userId) || emptyProfile(userId)
    return state.games.filter(game => purchased.has(game.id) || saved.has(game.id)).map(game => ({
      ...game, purchased: purchased.has(game.id), saved: saved.has(game.id), hours: profile.hours[game.id] || 0,
    }))
  }
  function read(userId) {
    const state = database.read()
    const profile = state.profiles?.find(item => item.userId === userId) || emptyProfile(userId)
    return {
      avatar: profile.avatar,
      banner: profile.banner || '',
      imageEdits: profile.imageEdits || {},
      games: library(state, userId),
      friends: profile.friends.flatMap(id => {
        const friend = state.users.find(item => item.id === id && item.role === 'client')
        return friend ? [{ id, name: friend.name, avatar: state.profiles?.find(item => item.userId === id)?.avatar || '' }] : []
      }),
    }
  }
  return {
    read,
    update(userId, data) {
      database.update(state => {
        const profile = structuredClone(state.profiles?.find(item => item.userId === userId) || emptyProfile(userId))
        if (data?.action === 'avatar' || data?.action === 'banner') {
          const target = data.action
          if (data[target] !== '') validateImage(data[target])
          profile[target] = data[target]
          if (profile.imageEdits) delete profile.imageEdits[target]
        } else if (data?.action === 'image') {
          if (!['avatar', 'banner'].includes(data.target)) fail(400, 'Destino de imagen no válido.')
          validateImage(data.image)
          validateImage(data.source, 1000000)
          const { fit, zoom, x, y } = data.settings || {}
          if (!['cover', 'contain'].includes(fit) || ![zoom, x, y].every(value => typeof value === 'number' && Number.isFinite(value)) || zoom < 1 || zoom > 3 || x < 0 || x > 100 || y < 0 || y > 100) fail(400, 'El encuadre de la imagen no es válido.')
          profile[data.target] = data.image
          profile.imageEdits = { ...profile.imageEdits, [data.target]: { source: data.source, settings: { fit, zoom, x, y } } }
        } else if (data?.action === 'hours') {
          if (!library(state, userId).some(game => game.id === data.gameId)) fail(403, 'El juego no está en tu biblioteca.')
          if (typeof data.hours !== 'number' || !Number.isFinite(data.hours) || data.hours < 0 || data.hours > 100000) fail(400, 'Ingresa entre 0 y 100000 horas.')
          profile.hours[data.gameId] = Math.round(data.hours * 10) / 10
        } else if (data?.action === 'add-friend') {
          if (data.friendId === userId) fail(400, 'No puedes añadirte a tu propia lista.')
          if (!state.users.some(item => item.id === data.friendId && item.role === 'client')) fail(404, 'No hay un cliente con ese código.')
          if (!profile.friends.includes(data.friendId)) {
            if (profile.friends.length >= 100) fail(400, 'Puedes guardar hasta 100 amigos.')
            profile.friends.push(data.friendId)
          }
        } else if (data?.action === 'remove-friend') {
          profile.friends = profile.friends.filter(id => id !== data.friendId)
        } else fail(400, 'Acción de perfil no válida.')
        return { ...state, profiles: [...(state.profiles || []).filter(item => item.userId !== userId), profile] }
      })
      return read(userId)
    },
  }
}
