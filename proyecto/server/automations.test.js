import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createAutomations } from './automations.js'

test('Automatizaciones: deduplicación, errores, reintento y payload sin credenciales', async () => {
  let state = {}
  const database = { read: () => structuredClone(state), update: change => { state = change(structuredClone(state)) } }
  const calls = []
  let failing = true
  const automations = createAutomations(database, {
    registrationUrl: 'http://localhost/webhook/nexus-registro', purchaseUrl: 'http://localhost/webhook/nexus-compra', token: 'test-token',
    fetcher: async (url, options) => {
      calls.push({ url, options })
      if (failing) return { ok: false, status: 503 }
      const flow = JSON.parse(readFileSync(new URL(url.endsWith('registro') ? './n8n-registro.json' : './n8n-compra.json', import.meta.url)))
      const code = flow.nodes.find(node => node.type === 'n8n-nodes-base.code').parameters.jsCode
      const result = new Function('$json', code)({ body: JSON.parse(options.body) }).json
      return { ok: true, json: async () => result }
    },
  })
  automations.enqueue('users', { id: 'u', name: 'Cliente', password: 'secret-password', email: 'private@test.com' })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(automations.status().events[0].status, 'failed')
  automations.enqueue('users', { id: 'u', name: 'Cliente' })
  assert.equal(state.automationEvents.length, 1)
  assert.ok(!calls[0].options.body.includes('secret-password'))
  assert.ok(!calls[0].options.body.includes('private@test.com'))
  assert.equal(calls[0].options.headers['X-Nexus-Token'], 'test-token')
  failing = false
  await automations.retry()
  automations.enqueue('orders', { id: 'o', title: 'Juego', totalCents: 1500 })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(state.automationEvents[0].result.event, 'onboarding.ready')
  assert.equal(state.automationEvents[1].result.amount, '15.00')
  assert.ok(state.automationEvents.every(event => event.status === 'delivered'))
  await automations.flush()
  assert.equal(calls.length, 3)
})

test('Sin n8n configurado se conservan los eventos pendientes sin bloquear operaciones', async () => {
  let state = {}
  const automations = createAutomations({ read: () => state, update: change => { state = change(state) } }, { registrationUrl: '', purchaseUrl: '', fetcher: () => { throw new Error('No debe llamar a la red') } })
  automations.enqueue('orders', { id: 'o', title: 'Juego', totalCents: 0 })
  await automations.flush()
  assert.equal(automations.status().events[0].status, 'pending')
})
