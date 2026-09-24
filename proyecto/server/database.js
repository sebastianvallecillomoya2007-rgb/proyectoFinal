import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const defaultDirectory = fileURLToPath(new URL('../', import.meta.url))
const collections = ['games', 'users', 'orders', 'wishlist', 'reviews']
const readJson = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
function validate(data) {
  if (!data || typeof data !== 'object' || collections.some(key => !Array.isArray(data[key]))) {
    throw new Error('bd.json debe contener games, users, orders, wishlist y reviews como listas.')
  }
  return data
}
function seedGames() {
  return readJson(new URL('../public/db.json', import.meta.url)).games.map(game => ({
    ...game,
    basePrice: game.isOffer ? game.oldPrice : game.price,
    oldPrice: game.isOffer ? game.oldPrice : null,
    discount: game.isOffer ? '-' + Math.round((1 - game.price / game.oldPrice) * 100) + '%' : null,
  }))
}

export function createDatabase(directory = defaultDirectory) {
  directory = resolve(directory)
  mkdirSync(directory, { recursive: true })
  const file = resolve(directory, 'bd.json')
  const legacyDirectory = directory === resolve(defaultDirectory) ? resolve(directory, 'server/data') : directory
  function write(data) {
    validate(data)
    writeFileSync(file + '.tmp', JSON.stringify(data, null, 2) + '\n', { mode: 0o600 })
    renameSync(file + '.tmp', file)
  }
  if (!existsSync(file)) {
    const legacy = name => {
      const path = resolve(legacyDirectory, name)
      return existsSync(path) ? readJson(path) : undefined
    }
    const commerce = legacy('commerce.json')
    const community = legacy('community.json')
    // Los archivos anteriores se conservan como respaldo y solo se leen al migrar.
    write({
      games: commerce?.games ?? seedGames(),
      users: legacy('users.json') ?? [],
      orders: commerce?.orders ?? [],
      wishlist: community?.wishlist ?? [],
      reviews: community?.reviews ?? [],
    })
  }
  const read = () => validate(readJson(file))
  read()
  return {
    file,
    read,
    update(change) {
      // Leer el estado completo evita que un módulo sobrescriba datos de otro.
      // Las actualizaciones son síncronas y atómicas dentro del proceso del servidor.
      const next = change(read())
      write(next)
      return next
    },
  }
}
