const labels = {
  action: 'Acción', adventure: 'Aventura', 'role-playing-games-rpg': 'RPG', rpg: 'RPG',
  indie: 'Indie', strategy: 'Estrategia', shooter: 'Disparos', casual: 'Casual',
  simulation: 'Simulación', puzzle: 'Puzles', arcade: 'Arcade', platformer: 'Plataformas',
  racing: 'Carreras', sports: 'Deportes', fighting: 'Lucha', family: 'Familia',
  board: 'Mesa', 'board-games': 'Juegos de mesa', educational: 'Educativos', card: 'Cartas',
  'massively-multiplayer': 'Multijugador masivo', scifi: 'Ciencia ficción', horror: 'Terror',
  uncategorized: 'Sin categoría',
  mmorpg: 'MMORPG', moba: 'MOBA', mmo: 'MMO', mmofps: 'MMOFPS', mmotps: 'MMOTPS', mmorts: 'MMORTS',
  'battle-royale': 'Battle Royale', 'action-rpg': 'RPG de acción', 'open-world': 'Mundo abierto',
  'sci-fi': 'Ciencia ficción', 'turn-based': 'Por turnos', 'first-person': 'Primera persona', 'third-person': 'Tercera persona',
  survival: 'Supervivencia', fantasy: 'Fantasía', 'tower-defense': 'Defensa de torres', 'low-spec': 'Bajos requisitos',
}
export const categoryLabel = slug => labels[slug] || slug.replaceAll('-', ' ')
export const gameCategories = game => game.categories?.length ? game.categories : [game.category || 'uncategorized']
export const matchesCategory = (game, category) => category === 'all' || gameCategories(game).includes(category)
