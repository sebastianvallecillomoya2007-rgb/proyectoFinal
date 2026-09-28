import { defineConfig } from '@playwright/test'

const port = process.env.E2E_PORT || '5187'
export default defineConfig({
  testDir: './src',
  testMatch: '**/*.e2e.js',
  outputDir: 'artifacts/browser-tests',
  workers: 1,
  timeout: 60000,
  use: { baseURL: `http://127.0.0.1:${port}`, headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node server/e2e-server.js', url: `http://127.0.0.1:${port}`, reuseExistingServer: false, timeout: 60000 },
})
