import { useState } from 'react'
import '../css/principal.css'

export default function Navbar({ onSearchChange, user, onLogout, loading }) {
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearchChange(event) {
    const value = event.target.value
    setSearchQuery(value)
    onSearchChange?.(value.toLowerCase().trim())
  }

  return (
    <header>
      <div className="logo">NEXUS GAMES</div>
      <nav>
        <a href="#/" className="active">Store</a>
        <a href="#">Library</a>
        <a href="#">Community</a>
        <a href={user ? '#/cuenta' : '#/login'}>Mi cuenta</a>
        <a href={user?.role === 'admin' ? '#/admin' : '#/admin/login'}>Administración</a>
      </nav>
      <div className="header-actions">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            id="searchInput"
            aria-label="Buscar juegos"
            placeholder="Search games..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="account-actions">
          {loading ? <span>Comprobando sesión…</span> : user ? <><a href="#/cuenta" className="auth-link account-name">{user.name}</a><button className="btn-redeem" onClick={onLogout}>Cerrar sesión</button></> : <><a className="auth-link" href="#/login">Iniciar sesión</a><a className="account-register" href="#/registro">Crear cuenta</a></>}
        </div>
      </div>
    </header>
  )
}
