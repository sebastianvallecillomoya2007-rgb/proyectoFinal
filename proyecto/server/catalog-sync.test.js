import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCatalogSync } from './catalog-sync.js'

test('carga cinco páginas y colecciones sin repetir la inicialización', async () => {
  const pages = []
  const collections = []
  const imported = []
  const rawg = {
    configured: true,
    async games(page) { pages.push(page); return { games: [{ id: page }], nextPage: page + 1, count: 500 } },
    async collection(kind) { collections.push(kind); return [{ id: kind }] },
  }
  const sync = createCatalogSync(rawg, { importGames: games => imported.push(...games) })
  await Promise.all([sync.initialize(), sync.initialize()])
  assert.deepEqual(pages, [1, 2, 3, 4, 5])
  assert.deepEqual(collections, ['recent', 'upcoming', 'indie'])
  assert.equal(imported.length, 8)
  assert.equal(sync.state.nextPage, 6)
  assert.equal(sync.state.syncing, false)
  await sync.initialize()
  assert.equal(pages.length, 5)
  await sync.page(1)
  assert.equal(sync.state.nextPage, 6)
  await sync.page(6)
  assert.equal(sync.state.nextPage, 7)
})

test('respeta el final de la paginación y conserva éxitos parciales', async () => {
  const pages = []
  const saved = []
  const sync = createCatalogSync({
    configured: true,
    async games(page) { pages.push(page); return { games: [page], nextPage: null, count: 1 } },
    async collection(kind) { if (kind === 'recent') throw Error('No disponible'); return [kind] },
  }, { importGames: games => saved.push(...games) })
  await sync.initialize()
  assert.deepEqual(pages, [1])
  assert.deepEqual(saved, [1, 'upcoming', 'indie'])
  assert.equal(sync.state.nextPage, null)
  assert.match(sync.state.error, /colecciones/)
})

test('sin clave no consulta RAWG; un fallo no bloquea el catálogo local', async () => {
  let calls = 0
  const rawg = { configured: false, async games() { calls++; throw Error('Sin conexión') } }
  const sync = createCatalogSync(rawg, {})
  await sync.initialize()
  assert.equal(calls, 0)
  rawg.configured = true
  const failing = createCatalogSync(rawg, {})
  await failing.initialize()
  assert.equal(failing.state.syncing, false)
  assert.equal(failing.state.error, 'Sin conexión')
  await failing.initialize()
  assert.equal(calls, 1)
})
