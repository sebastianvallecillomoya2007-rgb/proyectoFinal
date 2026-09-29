const field = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra })
const required = (key, label, type = 'text', extra = {}) => field(key, label, type, { required: true, ...extra })
const select = (key, label, options) => required(key, label, 'select', { options })
const status = options => select('status', 'Estado', options)
const name = required('name', 'Nombre')
const email = required('email', 'Correo electrónico', 'email')
const date = required('date', 'Fecha', 'date')
const description = field('description', 'Descripción', 'textarea')
const active = ['Activo', 'Desactivado']
export const schemas = {
  games: {
    title: 'Juegos', singular: 'juego', description: 'Tu catálogo, organizado y listo para la próxima aventura.',
    columns: ['id', 'name', 'price', 'oldPrice', 'discount', 'genre', 'category', 'developer', 'date', 'status'],
    filters: ['status', 'category', 'genre'], dateKey: 'date', create: true, edit: true, remove: true,
    fields: [name, required('price', 'Precio (USD)', 'number', { min: 0 }), field('oldPrice', 'Precio anterior (USD)', 'number', { min: 0 }), field('discount', 'Descuento (%)', 'number', { min: 0, max: 100 }), field('shortDescription', 'Descripción corta'), description, required('developer', 'Desarrollador', 'developer'), field('publisher', 'Publisher'), date, required('genre', 'Género'), required('category', 'Categoría', 'category'), field('platforms', 'Plataformas'), field('age', 'Edad recomendada'), field('languages', 'Idiomas'), field('size', 'Tamaño'), field('minimum', 'Requisitos mínimos', 'textarea'), field('recommended', 'Requisitos recomendados', 'textarea'), field('image', 'Imagen principal (URL)', 'url'), field('cover', 'Portada (URL)', 'url'), field('screenshots', 'Screenshots (una URL por línea)', 'textarea'), field('trailer', 'Trailer (URL)', 'url'), field('tags', 'Etiquetas (separadas por comas)'), status(['Publicado', 'Borrador', 'Pendiente', 'Desactivado'])],
    actions: [['Publicar', 'Publicado'], ['Desactivar', 'Desactivado']],
  },
  users: {
    title: 'Usuarios', singular: 'usuario', description: 'Conoce y gestiona a tu comunidad.',
    columns: ['id', 'name', 'username', 'email', 'date', 'lastAccess', 'status', 'purchases'],
    filters: ['status'], dateKey: 'date', edit: true, remove: true,
    fields: [name, required('username', 'Usuario'), email, date, field('lastAccess', 'Último acceso', 'date'), status(['Activo', 'Bloqueado', 'Suspendido'])],
    actions: [['Bloquear', 'Bloqueado'], ['Desbloquear', 'Activo']],
  },
  sales: {
    title: 'Ventas', singular: 'venta', description: 'Seguimiento de las compras de demostración. Importes expresados en USD.',
    columns: ['id', 'user', 'game', 'price', 'discount', 'total', 'method', 'date', 'status'], filters: ['status'], dateKey: 'date', fields: [],
  },
  categories: {
    title: 'Categorías y etiquetas', singular: 'categoría o etiqueta', description: 'Organiza los géneros y las formas de descubrir juegos.',
    columns: ['id', 'name', 'type', 'status'], filters: ['type', 'status'], create: true, edit: true, remove: true,
    fields: [name, select('type', 'Tipo', ['Categoría', 'Género', 'Etiqueta']), status(active)], actions: [['Activar', 'Activo'], ['Desactivar', 'Desactivado']],
  },
  promotions: {
    title: 'Promociones', singular: 'promoción', description: 'Campañas, cupones, descuentos individuales y bundles.',
    columns: ['name', 'type', 'code', 'discount', 'start', 'end', 'games', 'status'], filters: ['status', 'type'], dateKey: 'start', create: true, edit: true, remove: true,
    fields: [name, description, select('type', 'Tipo', ['Campaña', 'Cupón', 'Descuento individual', 'Bundle']), field('code', 'Código del cupón'), required('start', 'Fecha de inicio', 'date'), required('end', 'Fecha final', 'date'), required('discount', 'Descuento (%)', 'number', { min: 0, max: 100 }), required('games', 'Juegos incluidos', 'games'), status(['Activa', 'Programada', 'Finalizada', 'Desactivada'])],
    actions: [['Activar', 'Activa'], ['Desactivar', 'Desactivada']],
  },
  reviews: {
    title: 'Reseñas', singular: 'reseña', description: 'Escucha a los jugadores y modera las opiniones reportadas.',
    columns: ['user', 'game', 'score', 'comment', 'date', 'status'], filters: ['game', 'score', 'status'], dateKey: 'date', fields: [], remove: true,
    actions: [['Aprobar', 'Aprobada'], ['Ocultar', 'Oculta'], ['Reportar', 'Reportada']],
  },
  payments: {
    title: 'Pagos', singular: 'pago', description: 'Transacciones simuladas. No se almacenan tarjetas, CVV ni datos bancarios.',
    columns: ['id', 'user', 'saleId', 'method', 'total', 'date', 'status'], filters: ['status', 'method'], dateKey: 'date', fields: [],
  },
  refunds: {
    title: 'Reembolsos', singular: 'reembolso', description: 'Revisa cada solicitud y su compra asociada.',
    columns: ['id', 'user', 'game', 'total', 'reason', 'date', 'status'], filters: ['status'], dateKey: 'date', fields: [],
    actions: [['Aprobar', 'Aprobado'], ['Rechazar', 'Rechazado']],
  },
  developers: {
    title: 'Desarrolladores', singular: 'desarrollador', description: 'Los estudios que dan vida a tu catálogo.',
    columns: ['name', 'company', 'email', 'gameCount', 'units', 'revenue', 'status'], filters: ['status'], create: true, edit: true,
    fields: [name, required('company', 'Empresa'), email, status(active)], actions: [['Activar', 'Activo'], ['Desactivar', 'Desactivado']],
  },
  content: {
    title: 'Contenido', singular: 'contenido', description: 'Prepara banners, selecciones, noticias y eventos en el entorno de demostración.',
    columns: ['name', 'type', 'description', 'status'], filters: ['type', 'status'], create: true, edit: true, remove: true,
    fields: [name, select('type', 'Tipo', ['Banner', 'Destacado', 'Recomendado', 'Noticia', 'Evento', 'Anuncio']), description, field('image', 'Imagen (URL)', 'url'), field('game', 'Juego relacionado', 'game'), field('link', 'Enlace de destino'), status(active)], actions: [['Activar', 'Activo'], ['Desactivar', 'Desactivado']],
  },
  notifications: {
    title: 'Notificaciones', singular: 'notificación', description: 'Mantente al día con la actividad de tu comunidad.',
    columns: ['name', 'description', 'date', 'status'], filters: ['status'], dateKey: 'date', fields: [], actions: [['Marcar como leída', 'Leída'], ['Marcar como no leída', 'No leída']],
  },
  activity: {
    title: 'Historial de actividad', singular: 'actividad', description: 'Registro local de acciones administrativas. El historial no es una auditoría de seguridad.',
    columns: ['user', 'action', 'target', 'date', 'time'], filters: ['user', 'action'], dateKey: 'date', fields: [],
  },
}
export const labels = { id: 'ID', name: 'Nombre', price: 'Precio', oldPrice: 'Precio anterior', discount: 'Descuento (%)', genre: 'Género', category: 'Categoría', developer: 'Desarrollador', date: 'Fecha', status: 'Estado', username: 'Usuario', email: 'Correo', lastAccess: 'Último acceso', purchases: 'Compras', user: 'Usuario', game: 'Juego', total: 'Importe final', method: 'Método de pago', type: 'Tipo', code: 'Cupón', start: 'Inicio', end: 'Final', games: 'Juegos incluidos', score: 'Puntuación', comment: 'Comentario', saleId: 'Compra', reason: 'Motivo', company: 'Empresa', gameCount: 'Juegos', units: 'Ventas', revenue: 'Ingresos', description: 'Descripción', action: 'Acción', target: 'Elemento afectado', time: 'Hora (UTC)', userId: 'ID de usuario', gameId: 'ID de juego', timestamp: 'Instante UTC' }
