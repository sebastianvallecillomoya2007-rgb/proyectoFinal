export const DATA_KEY = 'nexus.admin.demo.v1'
export const SESSION_KEY = 'nexus.admin.session.v1'
export const roles = {
  'SUPER ADMIN': ['*'],
  ADMINISTRADOR: ['games', 'users', 'sales', 'statistics'],
  MODERADOR: ['reviews', 'users', 'reports'],
  EDITOR: ['games', 'categories', 'content', 'promotions'],
}
export const accounts = [
  { email: 'superadmin@nexus.demo', name: 'Alex Morgan', role: 'SUPER ADMIN' },
  { email: 'admin@nexus.demo', name: 'Andrea Vega', role: 'ADMINISTRADOR' },
  { email: 'moderador@nexus.demo', name: 'Daniel Sol', role: 'MODERADOR' },
  { email: 'editor@nexus.demo', name: 'Sofía Rivera', role: 'EDITOR' },
]
export const canAccess = (role, section) => section === 'dashboard' || roles[role]?.includes('*') || roles[role]?.includes(section)
export const navigation = [
  ['dashboard', 'Dashboard', '◈'], ['games', 'Juegos', '◧'], ['categories', 'Categorías y etiquetas', '⊞'],
  ['users', 'Usuarios', '♙'], ['sales', 'Ventas', '↗'], ['promotions', 'Promociones', '◇'],
  ['reviews', 'Reseñas', '☆'], ['payments', 'Pagos', '▣'], ['refunds', 'Reembolsos', '↶'],
  ['developers', 'Desarrolladores', '⌘'], ['statistics', 'Estadísticas', '▥'], ['content', 'Contenido', '▤'],
  ['notifications', 'Notificaciones', '♧'], ['activity', 'Actividad', '◷'], ['settings', 'Configuración', '⚙'],
]
export function dateAgo(days, now = new Date()) {
  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}
export const money = (value, currency = 'USD') => new Intl.NumberFormat('es-CR', { style: 'currency', currency }).format(Number(value) || 0)
export function displayDate(value, settings) {
  if (!value) return '—'
  if (settings.dateFormat === 'YYYY-MM-DD') return value.slice(0, 10)
  return value.slice(0, 10).split('-').reverse().join('/')
}
export function salesGroups(sales, period) {
  const size = period === 'Día' ? 1 : period === 'Semana' ? 7 : 30
  return Array.from({ length: 7 }, (_, i) => {
    const start = dateAgo((6 - i) * size + size - 1), end = dateAgo((6 - i) * size)
    const rows = sales.filter(sale => sale.date >= start && sale.date <= end && sale.status === 'Pagado')
    return { label: end.slice(5), value: rows.length, revenue: rows.reduce((sum, sale) => sum + sale.total, 0) }
  })
}
export function createSeed() {
  const titles = ['Elden Ring', 'Cyberpunk 2077', 'Hades', 'Hollow Knight', 'The Witcher 3', 'DOOM Eternal', 'Resident Evil 4', 'Red Dead Redemption 2', 'Stardew Valley', 'Celeste', 'Portal 2', 'No Man’s Sky', 'Baldur’s Gate 3', 'Forza Horizon 5', 'Dead Cells']
  const steam = [1245620, 1091500, 1145360, 367520, 292030, 782330, 2050650, 1174180, 413150, 504230, 620, 275850, 1086940, 1551360, 588650]
  const developers = ['FromSoftware', 'CD Projekt', 'Supergiant Games', 'Team Cherry', 'Nexus Indie Studio'].map((name, i) => ({ id: `DEV-${i + 1}`, name, company: name, email: `studio${i + 1}@example.test`, status: 'Activo' }))
  const categories = ['Acción', 'RPG', 'Aventura', 'Terror', 'Estrategia', 'Deportes', 'Carreras', 'Indie', 'FPS', 'Multiplayer', 'Open World', 'Singleplayer', 'Co-op', 'Souls-like', 'Horror', 'Anime', 'Sandbox'].map((name, i) => ({ id: `CAT-${i + 1}`, name, type: i < 10 ? 'Categoría' : 'Etiqueta', status: 'Activo' }))
  const games = titles.map((name, i) => ({ id: `GAME-${i + 1}`, name, price: 14.99 + i * 3, oldPrice: 69.99, discount: 0, genre: ['RPG', 'Acción', 'Indie'][i % 3], category: categories[i % 10].name, developer: developers[i % 5].name, publisher: developers[i % 5].name, date: dateAgo(i * 30), status: i < 11 ? 'Publicado' : i < 14 ? 'Pendiente' : 'Borrador', shortDescription: `Descubre el universo de ${name}.`, description: `${name} es un juego de demostración del catálogo administrativo.`, platforms: 'Windows', age: '16+', languages: 'Español, Inglés', size: '25 GB', minimum: 'Windows 10, 8 GB RAM, GPU compatible con DirectX 11', recommended: 'Windows 11, 16 GB RAM, SSD', image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steam[i]}/capsule_616x353.jpg`, cover: '', screenshots: '', trailer: '', tags: 'Singleplayer' }))
  const users = ['Lucía', 'Gabriel', 'Valeria', 'Mateo', 'Camila', 'Diego', 'Sofía', 'Andrés', 'Daniela', 'Nicolás', 'Isabella', 'Samuel', 'Mariana', 'Sebastián', 'Victoria'].map((name, i) => ({ id: `USR-${i + 1}`, name: `${name} Vega`, username: `${name.toLowerCase()}${i + 1}`, email: `jugador${i + 1}@example.test`, date: dateAgo(i * 5), lastAccess: dateAgo(i % 7), status: i === 8 ? 'Bloqueado' : 'Activo' }))
  const sales = Array.from({ length: 36 }, (_, i) => {
    const game = games[i % 15], user = users[i % 15]
    return { id: `SALE-${1001 + i}`, user: user.name, userId: user.id, game: game.name, gameId: game.id, price: game.price, discount: i % 3 === 0 ? 20 : 0, total: Number((game.price * (i % 3 === 0 ? 0.8 : 1)).toFixed(2)), method: ['Tarjeta demo', 'PayPal demo', 'Saldo demo'][i % 3], date: dateAgo(i < 20 ? i : i * 8), status: i % 9 === 0 ? 'Pendiente' : i % 11 === 0 ? 'Cancelado' : 'Pagado' }
  })
  return {
    version: 1, games, users, sales, developers, categories,
    payments: sales.map((sale, i) => ({ id: `PAY-${i + 1}`, saleId: sale.id, user: sale.user, method: sale.method, total: sale.total, date: sale.date, status: sale.status === 'Pagado' ? 'Completado' : sale.status === 'Cancelado' ? 'Rechazado' : 'Pendiente' })),
    refunds: sales.filter(sale => sale.status === 'Pagado').slice(0, 5).map((sale, i) => ({ id: `REF-${i + 1}`, saleId: sale.id, user: sale.user, game: sale.game, total: sale.total, reason: ['Problemas de rendimiento', 'Compra por error', 'No cumple las expectativas'][i % 3], date: dateAgo(i), status: 'Pendiente' })),
    reviews: Array.from({ length: 12 }, (_, i) => ({ id: `REV-${i + 1}`, user: users[i].name, game: games[i].name, score: i % 5 + 1, comment: ['Excelente ambientación y una historia memorable.', 'Me gustaría ver mejoras en el rendimiento.', 'Una experiencia que recomiendo a mis amigos.'][i % 3], date: dateAgo(i), status: i % 3 === 0 ? 'Reportada' : 'Aprobada' })),
    promotions: ['Summer Sale', 'Halloween Sale', 'Black Friday', 'Christmas Sale', 'Bienvenida NEXUS', 'Fin de semana indie', 'Pack de aventuras', 'Especial RPG'].map((name, i) => ({ id: `PROMO-${i + 1}`, name, description: 'Promoción de demostración, sin efecto en compras reales.', type: ['Campaña', 'Cupón', 'Descuento individual', 'Bundle'][i % 4], code: i % 4 === 1 ? `NEXUS${i + 1}` : '', discount: 10 + i * 5, start: dateAgo(i < 4 ? 7 : -7), end: dateAgo(-30), games: i % 4 === 3 ? [games[i].id, games[i + 1].id] : [games[i].id], status: i < 4 ? 'Activa' : 'Programada' })),
    content: ['Banner', 'Destacado', 'Recomendado', 'Noticia', 'Evento', 'Anuncio'].map((type, i) => ({ id: `CONTENT-${i + 1}`, name: ['Descubre tu próxima aventura', 'Selección de la semana', 'Hechos para ti', 'Lo nuevo en NEXUS', 'Fin de semana multijugador', 'Ofertas de temporada'][i], type, description: 'Explora nuevos mundos con NEXUS GAMES.', image: games[i].image, game: games[i].id, link: '#/', status: 'Activo' })),
    notifications: Array.from({ length: 12 }, (_, i) => ({ id: `NOTICE-${i + 1}`, name: ['Nuevo usuario registrado', 'Nueva venta', 'Juego agregado', 'Solicitud de reembolso', 'Reseña reportada', 'Juego pendiente de aprobación'][i % 6], description: `${users[i].name} · ${games[i].name}`, date: dateAgo(i), status: i < 8 ? 'No leída' : 'Leída' })),
    activity: Array.from({ length: 15 }, (_, i) => ({ id: `LOG-${i + 1}`, user: 'Alex Morgan', action: ['Creó juego', 'Editó promoción', 'Revisó usuario'][i % 3], target: [games[i].name, 'Summer Sale', users[i].name][i % 3], date: dateAgo(i), time: '10:30:00' })),
    settings: { name: 'NEXUS GAMES', logo: '', favicon: '', email: 'soporte@nexus.demo', currency: 'USD', language: 'Español', theme: 'Oscuro', notifications: 'Activadas', dateFormat: 'DD/MM/YYYY', timezone: 'America/Costa_Rica', privacy: 'Los datos de este prototipo se guardan únicamente en este navegador.', terms: 'Entorno de demostración. No se realizan compras reales.', refundPolicy: 'Las solicitudes se revisan de manera simulada.' },
  }
}

// Punto de integración: sustituir load/save por el repositorio de una API autenticada.
// Estas claves nunca se comparten con el catálogo, la sesión o las compras públicas.
export const repository = {
  load() {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return createSeed()
    const data = JSON.parse(raw)
    const seed = createSeed()
    if (data.version !== 1 || Object.keys(seed).some(key => Array.isArray(seed[key]) && !Array.isArray(data[key])) || !data.settings) throw new Error('Los datos administrativos guardados no son compatibles. No se han sobrescrito.')
    return data
  },
  save(data) { localStorage.setItem(DATA_KEY, JSON.stringify(data)) },
}
