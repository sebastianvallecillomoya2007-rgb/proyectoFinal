import { useEffect, useState } from 'react'
import { api } from '../auth/api'
import SalesPanel from './SalesPanel'

export default function AdminPage({ user }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    api('/admin/users').then(result => {
      if (active) { setUsers(result.users); setError(''); setLoading(false) }
    }).catch(error => { if (active) { setError(error.message); setLoading(false) } })
    return () => { active = false }
  }, [refresh])
  const clients = users.filter(account => account.role === 'client')
  const filtered = clients.filter(account => `${account.name} ${account.email}`.toLowerCase().includes(query.toLowerCase().trim()))
  return (
    <main className="admin-page">
      <span className="auth-eyebrow">NEXUS CONTROL</span>
      <h1>Panel de administración</h1>
      <p className="auth-description">Bienvenido, {user.name}. Consulta las cuentas registradas en NEXUS GAMES.</p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <SalesPanel />
      <div className="admin-stats">
        <section className="auth-card"><h2>Clientes registrados</h2><strong>{loading || error ? '—' : clients.length}</strong></section>
        <section className="auth-card"><h2>Administradores</h2><strong>{loading || error ? '—' : users.filter(account => account.role === 'admin').length}</strong></section>
      </div>
      <section className="auth-card" aria-labelledby="clients-title" aria-busy={loading}>
        <div className="admin-toolbar"><h2 id="clients-title">Clientes</h2><button className="btn-redeem" disabled={loading} onClick={() => { setLoading(true); setRefresh(value => value + 1) }}>Actualizar</button></div>
        <label className="admin-search" htmlFor="client-search">Buscar por nombre o correo<input id="client-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente…" /></label>
        {loading ? <p role="status">Cargando clientes…</p> : !error && <div className="admin-table-wrapper"><table className="admin-table"><caption>Cuentas de clientes ({filtered.length})</caption><thead><tr><th scope="col">Nombre</th><th scope="col">Correo electrónico</th><th scope="col">Fecha de registro</th></tr></thead><tbody>{filtered.map(account => <tr key={account.id}><td>{account.name}</td><td>{account.email}</td><td>{new Date(account.createdAt).toLocaleDateString('es-CR')}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="auth-description">{clients.length ? 'No hay clientes que coincidan con la búsqueda.' : 'Todavía no hay clientes registrados.'}</p>}</div>}
      </section>
    </main>
  )
}
