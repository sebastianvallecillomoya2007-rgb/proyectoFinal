import { randomUUID } from 'node:crypto'

export function createAutomations(database, { fetcher = fetch, registrationUrl = process.env.N8N_REGISTRATION_URL, purchaseUrl = process.env.N8N_PURCHASE_URL, token = process.env.N8N_WEBHOOK_TOKEN } = {}) {
  let working = false
  const urls = { 'user.registered': registrationUrl, 'order.created': purchaseUrl }
  const list = () => database.read().automationEvents || []
  const update = (id, patch) => database.update(state => ({ ...state, automationEvents: (state.automationEvents || []).map(event => event.id === id ? { ...event, ...patch } : event) }))
  async function flush() {
    if (working) return
    working = true
    try {
      for (const event of list().filter(item => item.status !== 'delivered' && item.attempts < 5 && (item.retryAt || 0) <= Date.now())) {
        const url = urls[event.type]
        if (!url) continue
        try {
          const response = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Nexus-Token': token } : {}) }, body: JSON.stringify({ ...event.payload, eventId: event.id }), signal: AbortSignal.timeout(8000) })
          if (!response.ok) throw new Error('n8n respondió HTTP ' + response.status)
          const result = await response.json()
          const expected = event.type === 'user.registered' ? 'onboarding.ready' : 'receipt.ready'
          if (result.event !== expected || result.status !== 200) throw new Error('n8n no devolvió la respuesta esperada del flujo.')
          update(event.id, { status: 'delivered', attempts: event.attempts + 1, deliveredAt: new Date().toISOString(), error: '', result })
        } catch (error) {
          update(event.id, { status: 'failed', attempts: event.attempts + 1, error: error.name === 'TimeoutError' ? 'n8n agotó el tiempo de respuesta.' : error.message, retryAt: Date.now() + Math.min(300000, 15000 * 2 ** event.attempts) })
        }
      }
    } finally { working = false }
  }
  function enqueue(resource, data) {
    const type = resource === 'users' ? 'user.registered' : resource === 'orders' ? 'order.created' : null
    if (!type || !data?.id || list().some(event => event.key === type + ':' + data.id)) return
    const payload = resource === 'users'
      ? { type, user: { id: data.id, name: data.name } }
      : { type, order: { id: data.id, title: data.title, totalCents: data.totalCents } }
    database.update(state => ({ ...state, automationEvents: [...(state.automationEvents || []), { id: randomUUID(), key: type + ':' + data.id, type, payload, status: 'pending', attempts: 0, createdAt: new Date().toISOString() }] }))
    void flush()
  }
  return {
    enqueue, flush,
    status: () => ({ configured: { registration: Boolean(registrationUrl), purchase: Boolean(purchaseUrl) }, events: list().slice(-20).reverse().map(({ id, type, status, attempts, error, createdAt }) => ({ id, type, status, attempts, error, createdAt })) }),
    async retry() {
      database.update(state => ({ ...state, automationEvents: (state.automationEvents || []).map(event => event.status === 'delivered' ? event : { ...event, attempts: 0, retryAt: 0 }) }))
      await flush()
      return this.status()
    },
  }
}
