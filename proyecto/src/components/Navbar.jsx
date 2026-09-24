import { useEffect, useState } from 'react'
import '../css/principal.css'

export default function Navbar({ onSearchChange, user, onLogout, loading }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [path, setPath] = useState(window.location.hash)
  useEffect(() => {
    const navigate = () => setPath(window.location.hash)
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  function search(event) {
    const value = event.target.value
    setSearchQuery(value)
    onSearchChange(value.toLowerCase().trim())
    if (window.location.hash !== '#/') window.location.hash = '/'
  }
  return <header className="site-header">
    <a className="logo" href="#/" aria-label="NEXUS GAMES, inicio">NEXUS GAMES</a>
    <nav className="main-navigation" aria-label="Navegación principal">
      <a className={!path || path === '#/' ? 'active' : ''} href="#/">Tienda</a>
      <a className={path === '#/deseados' ? 'active' : ''} href="#/deseados">Deseados</a>
      <a className={path.startsWith('#/admin') ? 'active' : ''} href={user?.role === 'admin' ? '#/admin' : '#/admin/login'}>Administración</a>
      {loading ? <span className="nav-session" role="status">Conectando…</span> : user ? <>
        <a href="#/cuenta" className={path === '#/cuenta' ? 'active account-name' : 'account-name'}>{user.name}</a>
        <button className="nav-logout" onClick={onLogout}>Cerrar sesión</button>
      </> : <>
        <a className={path === '#/login' ? 'active nav-login' : 'nav-login'} href="#/login">Iniciar sesión</a>
        <a className="account-register" href="#/registro">Crear cuenta</a>
      </>}
    </nav>
    <div className="search-box"><i aria-hidden="true" className="fa-solid fa-magnifying-glass" /><input type="search" aria-label="Buscar juegos" placeholder="Buscar juegos…" value={searchQuery} onChange={search} /></div>
  </header>
}
