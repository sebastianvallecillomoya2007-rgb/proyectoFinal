import { describe, expect, test } from '@jest/globals'
import { cosineSimilarity, rankEmbeddings, selectCandidates } from './semanticRanking.js'

describe('Búsqueda semántica', () => {
  test('compara significado con vectores, no con la escala de los valores', () => {
    expect(cosineSimilarity([1, 0], [20, 0])).toBe(1)
    expect(cosineSimilarity([1, 0], [-1, 0])).toBe(-1)
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0)
    expect(cosineSimilarity([1], [1, 2])).toBe(0)
  })
  test('ordena por afinidad y conserva identificadores para recuperar las fichas', () => {
    expect(rankEmbeddings([1, 0], [{ id: 'unrelated', vector: [0, 1] }, { id: 'matching', vector: [1, 0] }]).map(item => item.id)).toEqual(['matching', 'unrelated'])
  })
  test('limita el trabajo del navegador priorizando candidatos relevantes sin mutar el catálogo', () => {
    const games = [{ id: '1', title: 'Carreras' }, { id: '2', title: 'Aventura espacial' }]
    expect(selectCandidates(games, 'aventura', 1)[0].id).toBe('2')
    expect(games[0].id).toBe('1')
  })
})
