import { useEffect, useState } from 'react'
import '../css/principal.css'

export default function Navbar({ onSearchChange, user, onLogout, loading }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const update = () => setHash(window.location.hash)
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  function search(event) {
    setSearchQuery(event.target.value)
    onSearchChange(event.target.value.trim().toLowerCase())
    if (event.target.value) window.location.hash = '/?view=all'
  }
  return <header className="nexus-header"><a className="brand" href="#/" aria-label="NEXUS GAMES, inicio"><span className="brand-symbol">N</span>NEXUS<span>GAMES</span></a>
    <nav aria-label="Navegación principal"><a href="#/" className={!hash || hash === '#/' ? 'active' : ''}>Descubrir</a><a href="#/?view=all" className={hash.includes('view=all') ? 'active' : ''}>Catálogo</a><a href="#/?view=offers" className={hash.includes('view=offers') ? 'active' : ''}>Ofertas <span className="nav-offer-dot" /></a></nav>
    <div className="header-actions"><div className="search-box"><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar juegos" placeholder="Encuentra tu próximo juego…" value={searchQuery} onChange={search} /></div><a className="admin-access" href={user?.role === 'admin' ? '#/admin' : '#/admin/login'} aria-label="Administración" title="Administración">⚙</a><div className="account-actions">{loading ? <span className="session-loading">Conectando…</span> : user ? <><a className="account-name" href="#/cuenta">{user.name}</a><button className="logout-button" onClick={onLogout}>Salir</button></> : <><a className="login-link" href="#/login">Ingresar</a><a className="account-register" href="#/registro">Crear cuenta ↗</a></>}</div></div>
  </header>
}
