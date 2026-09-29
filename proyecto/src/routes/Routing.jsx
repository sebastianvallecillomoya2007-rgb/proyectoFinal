import { t } from '../language'
import { useEffect } from 'react'
import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import AuthPage from '../auth/AuthPage'
import AdminApp from '../admin/control/AdminApp'
import GamePage from '../pages/GamePage'
import WishlistPage from '../pages/WishlistPage'
import ProfilePage from '../pages/ProfilePage'
import RequireSession from './RequireSession'
function GameRoute({ user }) {
  const { id } = useParams()
  return <GamePage key={id + (user?.id || '')} id={id} user={user} />
}
export default function Routing({ user, loading, onAuthenticated, children }) {
  const location = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])
  const next = new URLSearchParams(location.search).get('next')
  const protect = (element, role) => <RequireSession user={user} loading={loading} role={role}>{t(element)}</RequireSession>
  return <Routes>
    <Route path="/" element={children} />
    <Route path="/juego/:id" element={<GameRoute user={user} />} />
    <Route path="/deseados" element={protect(<WishlistPage key={user?.id} user={user} />)} />
    <Route path="/admin/*" element={<AdminApp />} />
    <Route path="/cuenta" element={protect(user?.role === 'client' ? <ProfilePage key={user.id} user={user} /> : <main className="account-page"><section className="auth-card"><span className="auth-eyebrow">{t("MI CUENTA")}</span><h1>{t("Hola, ")}{user?.name}</h1><p className="auth-description">{t("Has iniciado sesión correctamente.")}</p><dl className="account-details"><dt>{t("Correo electrónico")}</dt><dd>{user?.email}</dd><dt>{t("Tipo de cuenta")}</dt><dd>{t("Administrador")}</dd></dl><a href="#/" className="auth-link">{t("Explorar la tienda →")}</a></section></main>)} />
    {[['/login', 'login'], ['/registro', 'register']].map(([path, mode]) => <Route key={path} path={path} element={<AuthPage key={mode} mode={mode} next={next} onAuthenticated={onAuthenticated} />} />)}
    <Route path="*" element={<main className="account-page"><h1>{t("Página no encontrada")}</h1><a className="auth-link" href="#/">{t("Volver a la tienda")}</a></main>} />
  </Routes>
}
