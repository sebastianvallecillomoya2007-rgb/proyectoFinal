import { test, expect } from '@playwright/test'

test('Catálogo FreeToGame: filtros, fotos, precios y ficha sin alterar la tienda', async ({ page }) => {
  const calls = []
  const sample = { id: 'freetogame-540', source: 'freetogame', sourceId: '540', title: 'Overwatch', description: 'Un juego de disparos gratuito.', price: 0, image: '/favicon.svg', categories: ['shooter'], category: 'shooter', platforms: [{ id: 'windows', name: 'Windows' }], released: '2022-10-04', developer: 'Blizzard', publisher: 'Blizzard', screenshots: ['/favicon.svg'], sourceUrl: 'https://www.freetogame.com/overwatch', homepage: 'https://www.freetogame.com/open/overwatch', requirements: { os: 'Windows 10', cpu: 'Core i5', ram: '8 GB', gpu: 'GTX 960', storage: '50 GB', directx: 'No especificado', source: 'https://www.freetogame.com/overwatch', sourceName: 'FreeToGame' } }
  await page.route('https://**/*', route => route.abort())
  await page.route('**/api/freetogame/games?*', async route => {
    const url = new URL(route.request().url())
    calls.push(url.search)
    await route.fulfill({ json: { games: url.searchParams.get('platform') === 'browser' ? [] : [sample], categories: ['shooter', 'mmorpg', 'pvp'], notice: '' } })
  })
  await page.route('**/api/games/freetogame-540', route => route.fulfill({ json: { game: sample, reviews: [], saved: false, notice: '' } }))
  await page.goto('/#/')
  await expect(page.locator('#gamesGrid').getByRole('heading', { name: 'Elden Ring', exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Catálogo', exact: true }).selectOption('freetogame')
  const card = page.locator('#gamesGrid .game-card').filter({ hasText: 'Overwatch' })
  await expect(card).toBeVisible()
  await expect(card.locator('.price')).toHaveText('Gratis')
  await expect(card.locator('img')).toBeVisible()
  await page.getByRole('combobox', { name: 'Plataforma', exact: true }).selectOption('windows')
  await page.getByRole('combobox', { name: 'Ordenar por', exact: true }).selectOption('release-date')
  await expect(card).toBeVisible()
  expect(calls.some(call => call.includes('platform=windows') && call.includes('sort-by=release-date'))).toBe(true)
  await page.locator('.category-item').filter({ hasText: 'pvp' }).click()
  await expect(card).toBeVisible()
  expect(calls.some(call => call.includes('category=pvp'))).toBe(true)
  await card.getByRole('link', { name: 'Overwatch', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Overwatch', exact: true })).toBeVisible()
  await expect(page.locator('.detail-price')).toHaveText('Gratis')
  await expect(page.getByRole('link', { name: 'Fuente: FreeToGame ↗' })).toHaveAttribute('href', 'https://www.freetogame.com/overwatch')
  await expect(page.getByText('Core i5', { exact: true })).toBeVisible()
  await page.goto('/#/')
  await expect(page.locator('#gamesGrid').getByRole('heading', { name: 'Elden Ring', exact: true })).toBeVisible()
})
