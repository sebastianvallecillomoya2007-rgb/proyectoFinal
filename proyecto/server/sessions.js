import { createHash } from 'node:crypto'
const digest = token => createHash('sha256').update(token || '').digest('hex')
export function createSessions(database) {
  return {
    get(token) { return database.read().sessions?.find(item => item.id === digest(token)) },
    set(token, session) {
      database.update(state => ({ ...state, sessions: [...(state.sessions || []).filter(item => item.expires > Date.now() && item.id !== digest(token)), { id: digest(token), ...session }] }))
    },
    delete(token) {
      if (!token) return
      database.update(state => ({ ...state, sessions: (state.sessions || []).filter(item => item.id !== digest(token) && item.expires > Date.now()) }))
    },
    prune() {
      if (database.read().sessions?.some(item => item.expires <= Date.now())) database.update(state => ({ ...state, sessions: state.sessions.filter(item => item.expires > Date.now()) }))
    },
  }
}
