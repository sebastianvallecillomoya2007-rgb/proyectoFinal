import { spawn } from 'node:child_process'
import { server } from './index.js'

server.listen(3001, '127.0.0.1', () => console.log('API de cuentas lista en el puerto 3001'))
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit' })
vite.on('exit', code => { server.close(); process.exit(code || 0) })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { vite.kill(); server.close(); process.exit(0) })
server.on('error', error => { console.error(error.message); vite.kill(); process.exit(1) })
