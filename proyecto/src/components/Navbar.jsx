import { t } from '../language'
import { useEffect, useState } from 'react'
import '../css/principal.css'
import Settings from './Settings'
import BrandLogo from './BrandLogo'

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
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); const main = document.querySelector('main'); if (main) { main.tabIndex = -1; main.focus(); main.scrollIntoView() } }}>{t("Saltar al contenido")}</a>
    <a className="logo" href="#/" aria-label={t("NEXUS GAMES, inicio")}><BrandLogo name={t('NEXUS GAMES')} /></a>
    <nav className="main-navigation" aria-label={t("Navegación principal")}>
      <a className={!path || path === '#/' ? 'active' : ''} href="#/">{t("Tienda")}</a>
      <a className={path === '#/deseados' ? 'active' : ''} href="#/deseados">{t("Deseados")}</a>
      <a className={path.startsWith('#/admin') ? 'active' : ''} href={user?.role === 'admin' ? '#/admin' : '#/admin/login'}>{t("Administración")}</a>
      {loading ? <span className="nav-session" role="status">{t("Conectando…")}</span> : user ? <>
        <a href="#/cuenta" className={path === '#/cuenta' ? 'active account-name' : 'account-name'} aria-current={path === '#/cuenta' ? 'page' : undefined}>{user.role === 'client' ? t('Mi perfil') : user.name}</a>
        <button className="nav-logout" onClick={onLogout}>{t("Cerrar sesión")}</button>
      </> : <>
        <a className={path === '#/login' ? 'active nav-login' : 'nav-login'} href="#/login">{t("Iniciar sesión")}</a>
        <a className="account-register" href="#/registro">{t("Crear cuenta")}</a>
      </>}
    </nav>
    <div className="search-box"><i aria-hidden="true" className="fa-solid fa-magnifying-glass" /><input type="search" aria-label={t("Buscar juegos")} placeholder={t("Buscar juegos…")} value={searchQuery} onChange={search} /></div>
    <Settings />
  </header>
}
