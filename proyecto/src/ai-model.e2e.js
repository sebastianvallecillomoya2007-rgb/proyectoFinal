import process from 'node:process'
import { test, expect } from '@playwright/test'

test('Modelo real: relaciona una búsqueda en español con juegos descritos en inglés', async ({ page }) => {
  test.skip(process.env.NEXUS_REAL_AI !== '1', 'Prueba opcional: descarga el modelo real de Hugging Face.')
  test.setTimeout(360000)
  await page.route('**/api/games', route => route.fulfill({ json: {
    games: [
      { id: 'cars', title: 'Circuit Racing', category: 'racing', categories: ['racing'], image: '', price: 10, description: 'Drive fast cars on racing circuits. Compete in motorsport tournaments and win races.' },
      { id: 'space', title: 'Orbital Journey', category: 'adventure', categories: ['adventure'], image: '', price: 10, description: 'Explore distant planets and travel through the galaxy in your spaceship. Discover alien worlds in outer space.' },
    ],
  } }))
  await page.goto('/#/')
  await page.getByRole('searchbox', { name: 'Buscar juegos' }).fill('quiero explorar planetas y viajar en una nave espacial')
  await page.getByRole('combobox', { name: 'Ordenar por', exact: true }).selectOption('ai')
  await expect(page.getByText('IA: 2 juegos ordenados por afinidad.', { exact: false })).toBeVisible({ timeout: 330000 })
  await expect(page.locator('#gamesGrid .game-title').first()).toHaveText('Orbital Journey')
})
