import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { canAccess, navigation } from './model'
import BrandLogo from '../../components/BrandLogo'

export default function AdminLayout({ store, section, children }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { session, data } = store
  const search = query.trim().toLocaleLowerCase()
  const results = search ? ['games', 'users', 'sales', 'developers', 'categories'].filter(key => canAccess(session.role, key)).flatMap(key => data[key].filter(row => Object.values(row).join(' ').toLocaleLowerCase().includes(search)).map(row => ({ key, row }))).slice(0, 8) : []
  const unread = data.notifications.filter(item => item.status === 'No leída').length
  return <div className="ac-layout">
    <aside className={`ac-sidebar ${open ? 'ac-sidebar-open' : ''}`} id="admin-navigation"><Link to="/admin" className="ac-brand"><BrandLogo name={data.settings.name} /><small>CONTROL CENTER</small></Link><p className="ac-nav-label">WORKSPACE</p><nav aria-label="Administración">{navigation.filter(([key]) => canAccess(session.role, key)).map(([key, title, icon]) => <NavLink key={key} to={key === 'dashboard' ? '/admin' : `/admin/${key}`} end onClick={() => setOpen(false)}><span aria-hidden="true">{icon}</span>{title}{key === 'notifications' && unread > 0 && <b>{unread}</b>}</NavLink>)}</nav><div className="ac-sidebar-bottom"><Link to="/">↗ Volver a la tienda</Link><button onClick={store.logout}>⇥ Cerrar sesión</button><small>Entorno de demostración · v1.0</small></div></aside>
    <div className="ac-workspace"><header className="ac-header"><button className="ac-menu" aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)}>{open ? '× Cerrar menú' : '☰ Menú'}</button><div className="ac-global-search"><label><span className="ac-sr">Buscar en administración</span><input type="search" placeholder="⌕  Buscar en administración…" value={query} onChange={event => setQuery(event.target.value)} /></label>{search && <div className="ac-search-results" aria-live="polite">{results.length ? results.map(({ key, row }) => <Link key={`${key}-${row.id}`} onClick={() => setQuery('')} to={`/admin/${key}?record=${encodeURIComponent(row.id)}`}><small>{navigation.find(([id]) => id === key)?.[1]}</small>{row.name || row.id}</Link>) : <p>Sin resultados</p>}</div>}</div><span className="ac-demo"><i /> Demo local</span><div className="ac-account"><span className="ac-avatar">{session.name.slice(0, 1)}</span><span>{session.name}<small>{session.role}</small></span></div></header>
      <main className="ac-main" id="admin-main"><p className="ac-breadcrumb"><BrandLogo name="NEXUS CONTROL" /> <span>/ {navigation.find(([key]) => key === section)?.[1] || 'Página'}</span></p>{store.error && <p className="ac-error" role="alert">{store.error}</p>}{store.message && <div className="ac-success" role="status">{store.message}<button aria-label="Cerrar mensaje" onClick={store.clearMessage}>×</button></div>}{children}<footer className="ac-footer"><BrandLogo name="NEXUS GAMES · Administración" /><span>Datos simulados. Sin pagos reales.</span></footer></main>
    </div>
  </div>
}
