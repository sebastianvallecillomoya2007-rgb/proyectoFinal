import { describe, expect, test } from '@jest/globals'
import { categoryLabel, gameCategories, matchesCategory } from './categories.js'

describe('Filtros del catálogo', () => {
  test('un juego con varios géneros aparece en cada filtro correspondiente', () => {
    const game = { categories: ['action', 'adventure'], category: 'indie' }
    expect(matchesCategory(game, 'action')).toBe(true)
    expect(matchesCategory(game, 'adventure')).toBe(true)
    expect(matchesCategory(game, 'indie')).toBe(false)
    expect(matchesCategory(game, 'all')).toBe(true)
  })

  test('admite juegos antiguos con una categoría y juegos sin clasificación', () => {
    expect(gameCategories({ category: 'rpg' })).toEqual(['rpg'])
    expect(gameCategories({ categories: [], category: 'puzzle' })).toEqual(['puzzle'])
    expect(gameCategories({})).toEqual(['uncategorized'])
    expect(matchesCategory({}, 'action')).toBe(false)
  })

  test('traduce géneros conocidos y permite categorías nuevas del proveedor', () => {
    expect(categoryLabel('action')).toBe('Acción')
    expect(categoryLabel('role-playing-games-rpg')).toBe('RPG')
    expect(categoryLabel('new-genre')).toBe('new genre')
  })
})
