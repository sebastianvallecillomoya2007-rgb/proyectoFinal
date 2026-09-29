import { test } from 'node:test'
import assert from 'node:assert/strict'
import { keepCatalogGame } from './catalog-policy.js'

test('conserva juegos del código y FreeToPlay aunque falten datos', () => {
  for (const game of [{ id: '1' }, { id: 'freetogame-42', source: 'freetogame' }, { id: 'free', price: 0 }, { id: 'free-flag', isFreeToPlay: true }]) {
    assert.equal(keepCatalogGame(game), true)
  }
})

test('todas las categorías exigen imagen y precio para los demás juegos', () => {
  for (const category of ['action', 'rpg', 'indie', 'uncategorized']) {
    const game = { id: 'external', category, image: 'https://example.com/game.jpg', price: 10 }
    assert.equal(keepCatalogGame(game), true)
    for (const price of [null, undefined, '', '10', -1, NaN, Infinity]) assert.equal(keepCatalogGame({ ...game, price }), false)
    for (const image of [null, undefined, '', ' ']) assert.equal(keepCatalogGame({ ...game, image }), false)
  }
})
