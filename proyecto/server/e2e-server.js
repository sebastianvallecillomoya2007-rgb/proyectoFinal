import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { createServer } from 'vite'

const directory = mkdtempSync(join(tmpdir(), 'nexus-e2e-'))
process.env.AUTH_DATA_DIR = directory
process.env.OPENGAMES_API_URL = ''
process.env.N8N_REGISTRATION_URL = ''
process.env.N8N_PURCHASE_URL = ''
process.env.ADMIN_EMAIL = 'admin@e2e.test'
process.env.ADMIN_PASSWORD = 'Admin-e2e-123!'
const { server } = await import('./index.js')
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const vite = await createServer({ server: { host: '127.0.0.1', port: Number(process.env.E2E_PORT || 5187), strictPort: true, proxy: { '/api': { target: `http://127.0.0.1:${server.address().port}`, changeOrigin: false } } } })
await vite.listen()
let closing = false
async function close() {
  if (closing) return
  closing = true
  await vite.close()
  await new Promise(resolve => server.close(resolve))
  if (dirname(resolve(directory)) === resolve(tmpdir()) && basename(directory).startsWith('nexus-e2e-')) rmSync(directory, { recursive: true, force: true })
  process.exit(0)
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, close)
