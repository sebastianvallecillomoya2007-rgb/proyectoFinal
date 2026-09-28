import { t, getLocale } from '../language'
import { useEffect, useState } from 'react'
import { api } from '../auth/api'
import SalesPanel from './SalesPanel'
import ResourceManager from './ResourceManager'

export default function AdminPage({ user }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [managing, setManaging] = useState(false)
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
      <span className="auth-eyebrow">{t("NEXUS CONTROL")}</span>
      <h1>{t("Panel de administración")}</h1>
      <p className="auth-description">{t("Bienvenido, ")}{user.name}{t(". Consulta las cuentas registradas en NEXUS GAMES.")}</p>
      {error && <p className="auth-error" role="alert">{t(error)}</p>}
      <SalesPanel key={refresh} />
      <div className="admin-stats">
        <section className="auth-card"><h2>{t("Clientes registrados")}</h2><strong>{loading || error ? t('—') : t(clients.length)}</strong></section>
        <section className="auth-card"><h2>{t("Administradores")}</h2><strong>{loading || error ? t('—') : t(users.filter(account => account.role === 'admin').length)}</strong></section>
      </div>
      <section className="auth-card" aria-labelledby="clients-title" aria-busy={loading}>
        <div className="admin-toolbar"><h2 id="clients-title">{t("Clientes")}</h2><button className="btn-redeem" onClick={() => setManaging(true)}>{t("Gestionar registros")}</button><button className="btn-redeem" disabled={loading} onClick={() => { setLoading(true); setRefresh(value => value + 1) }}>{t("Actualizar")}</button></div>
        <label className="admin-search" htmlFor="client-search">{t("Buscar por nombre o correo")}<input id="client-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Buscar cliente…")} /></label>
        {loading ? <p role="status">{t("Cargando clientes…")}</p> : !error && <div className="admin-table-wrapper"><table className="admin-table"><caption>{t("Cuentas de clientes (")}{t(filtered.length)}{t(")")}</caption><thead><tr><th scope="col">{t("Nombre")}</th><th scope="col">{t("Correo electrónico")}</th><th scope="col">{t("Fecha de registro")}</th></tr></thead><tbody>{filtered.map(account => <tr key={account.id}><td>{account.name}</td><td>{account.email}</td><td>{t(new Date(account.createdAt).toLocaleDateString(getLocale()))}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="auth-description">{clients.length ? t('No hay clientes que coincidan con la búsqueda.') : t('Todavía no hay clientes registrados.')}</p>}</div>}
      </section>
      {managing && <ResourceManager onClose={() => setManaging(false)} onChanged={() => { setLoading(true); setRefresh(value => value + 1) }} />}
    </main>
  )
}
