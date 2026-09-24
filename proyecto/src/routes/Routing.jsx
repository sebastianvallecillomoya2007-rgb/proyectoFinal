import { useEffect, useState } from 'react'
import AuthPage from '../auth/AuthPage'
import AdminPage from '../admin/AdminPage'

export default function Routing({ user, loading, onAuthenticated, children }) {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/')
  useEffect(() => {
    const navigate = () => { setPath(window.location.hash.slice(1) || '/'); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  if (path.split('?')[0] === '/') return children
  if (loading) return <main className="account-page" role="status">Comprobando sesión…</main>
  if (path === '/admin' && user?.role === 'admin') return <AdminPage user={user} />
  if (path === '/cuenta' && user) return <main className="account-page"><section className="auth-card"><span className="auth-eyebrow">MI CUENTA</span><h1>Hola, {user.name}</h1><p className="auth-description">Has iniciado sesión correctamente.</p><dl className="account-details"><dt>Correo electrónico</dt><dd>{user.email}</dd><dt>Tipo de cuenta</dt><dd>{user.role === 'admin' ? 'Administrador' : 'Cliente'}</dd></dl><a href="#/" className="auth-link">Explorar la tienda →</a></section></main>
  if (['/login', '/registro', '/admin/login', '/admin', '/cuenta'].includes(path)) {
    const mode = path.startsWith('/admin') ? 'admin' : path === '/registro' ? 'register' : 'login'
    return <AuthPage key={mode} mode={mode} onAuthenticated={onAuthenticated} />
  }
  return <main className="account-page"><h1>Página no encontrada</h1><a className="auth-link" href="#/">Volver a la tienda</a></main>
}
