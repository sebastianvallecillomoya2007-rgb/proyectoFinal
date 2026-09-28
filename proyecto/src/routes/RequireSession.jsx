import { t } from '../language'
import { Navigate, useLocation } from 'react-router-dom'
export default function RequireSession({ user, loading, role, children }) {
  const location = useLocation()
  if (loading) return <main className="account-page" role="status">{t("Comprobando sesión…")}</main>
  if (!user) return <Navigate replace to={(role === 'admin' ? '/admin/login' : '/login') + '?next=' + encodeURIComponent(location.pathname)} />
  if (role && user.role !== role) return <main className="account-page"><h1>{t("Acceso restringido")}</h1><p>{t("Tu cuenta no tiene permisos para esta sección.")}</p><a className="auth-link" href="#/">{t("Volver a la tienda")}</a></main>
  return children
}
