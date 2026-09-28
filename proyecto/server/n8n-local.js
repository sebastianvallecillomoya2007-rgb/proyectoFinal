import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { delimiter, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

const root = fileURLToPath(new URL('../', import.meta.url))
const folder = resolve(root, 'server/data/n8n')
mkdirSync(folder, { recursive: true })
const cli = (process.env.PATH || '').split(delimiter).map(directory => resolve(directory, '../n8n/bin/n8n')).find(existsSync)
if (!cli) throw new Error('Ejecuta npm run n8n para cargar la versión de n8n del proyecto.')
const probe = createServer()
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
const brokerPort = String(probe.address().port)
await new Promise(resolve => probe.close(resolve))
const env = { ...process.env, N8N_USER_FOLDER: folder, N8N_LISTEN_ADDRESS: '127.0.0.1', N8N_HOST: '127.0.0.1', N8N_PORT: '5678', N8N_RUNNERS_BROKER_PORT: brokerPort, N8N_PROTOCOL: 'http', N8N_SECURE_COOKIE: 'false', N8N_DIAGNOSTICS_ENABLED: 'false', N8N_VERSION_NOTIFICATIONS_ENABLED: 'false', N8N_TEMPLATES_ENABLED: 'false' }
let child
function execute(args) {
  return new Promise((done, reject) => {
    child = spawn(process.execPath, [cli, ...args], { env, stdio: 'inherit', windowsHide: true })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? done() : reject(new Error('n8n terminó con código ' + code)))
  })
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child?.kill(); process.exit(0) })
const marker = resolve(folder, 'initialized.json')
if (!existsSync(marker)) {
  const flows = [['n8n-registro.json', 'nexusRegistro0001'], ['n8n-compra.json', 'nexusCompra000001']]
  for (const [file, id] of flows) {
    const workflow = JSON.parse(readFileSync(resolve(root, 'server', file), 'utf8'))
    workflow.id = id
    const target = resolve(folder, file)
    writeFileSync(target, JSON.stringify(workflow))
    await execute(['import:workflow', '--input=' + target])
    await execute(['publish:workflow', '--id=' + id])
  }
  writeFileSync(marker, JSON.stringify({ initializedAt: new Date().toISOString() }))
}
await execute(['start'])
