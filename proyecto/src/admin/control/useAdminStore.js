import { useState } from 'react'
import { accounts, canAccess, repository, SESSION_KEY } from './model'

export default function useAdminStore() {
  const [initial] = useState(() => {
    try { return { data: repository.load(), error: '' } }
    catch (error) { return { data: null, error: error.message } }
  })
  const [data, setData] = useState(initial.data)
  const [error, setError] = useState(initial.error)
  const [message, setMessage] = useState('')
  const [session, setSession] = useState(() => {
    try { return accounts.find(account => account.email === JSON.parse(localStorage.getItem(SESSION_KEY))?.email) || null }
    catch { return null }
  })
  function login(email, password) {
    const account = accounts.find(item => item.email === email.trim().toLowerCase())
    if (!account || password !== 'NexusDemo2026!') throw new Error('Correo o contraseña de demostración incorrectos.')
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: account.email }))
    setSession(account)
  }
  function logout() {
    try { localStorage.removeItem(SESSION_KEY); setSession(null) }
    catch { setError('No se pudo cerrar la sesión local. Comprueba el almacenamiento del navegador.') }
  }
  function commit(section, update, action, target) {
    if (!session || !canAccess(session.role, section)) { setError('Tu rol no permite esta acción.'); return false }
    const now = new Date()
    const next = update(structuredClone(data))
    next.activity.unshift({ id: crypto.randomUUID(), user: session.name, action, target, date: now.toISOString().slice(0, 10), time: now.toISOString().slice(11, 19), timestamp: now.toISOString() })
    if (next.settings.notifications === 'Activadas' && !['notifications', 'settings'].includes(section)) next.notifications.unshift({ id: crypto.randomUUID(), name: action, description: `${session.name} · ${target}`, date: now.toISOString().slice(0, 10), status: 'No leída' })
    try {
      repository.save(next)
      setData(next); setError(''); setMessage(`${action}: ${target}. Cambios guardados.`)
      return true
    } catch { setError('No se pudo guardar. El almacenamiento está lleno o bloqueado; tus cambios no se aplicaron.'); return false }
  }
  return { data, session, login, logout, error, message, clearMessage: () => setMessage(''), commit }
}
