const labels = {
  action: 'Acción', adventure: 'Aventura', 'role-playing-games-rpg': 'RPG', rpg: 'RPG',
  indie: 'Indie', strategy: 'Estrategia', shooter: 'Disparos', casual: 'Casual',
  simulation: 'Simulación', puzzle: 'Puzles', arcade: 'Arcade', platformer: 'Plataformas',
  racing: 'Carreras', sports: 'Deportes', fighting: 'Lucha', family: 'Familia',
  board: 'Mesa', 'board-games': 'Juegos de mesa', educational: 'Educativos', card: 'Cartas',
  'massively-multiplayer': 'Multijugador masivo', scifi: 'Ciencia ficción', horror: 'Terror',
  uncategorized: 'Sin categoría',
}
export const categoryLabel = slug => labels[slug] || slug.replaceAll('-', ' ')
export const gameCategories = game => game.categories?.length ? game.categories : [game.category || 'uncategorized']
export const matchesCategory = (game, category) => category === 'all' || gameCategories(game).includes(category)
