import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import useAdminStore from './useAdminStore'
import AdminLogin from './AdminLogin'
import AdminLayout from './AdminLayout'
import AdminDashboard from './AdminDashboard'
import EntityPage from './EntityPage'
import AdminStatistics from './AdminStatistics'
import AdminSettings from './AdminSettings'
import { canAccess, navigation } from './model'
import './admin.css'

export default function AdminApp() {
  const store = useAdminStore()
  const location = useLocation()
  const section = location.pathname.split('/')[2] || 'dashboard'
  return <div className="ac-root" lang="es" data-admin-theme={store.data?.settings.theme}>
    {section === 'login' ? <AdminLogin store={store} /> : !store.session ? <Navigate to="/admin/login" replace /> : !store.data ? <main className="ac-main"><h1>No se pudieron cargar los datos</h1><p role="alert">{store.error}</p><p>Revisa el almacenamiento del navegador. Los datos originales se han conservado.</p><button onClick={store.logout}>Cerrar sesión</button></main> : <AdminLayout store={store} section={section}>
      {!canAccess(store.session.role, section) ? <section className="ac-panel"><h1>Acceso restringido</h1><p>Tu rol no tiene permisos para esta sección.</p></section> : <Routes>
        <Route index element={<AdminDashboard store={store} />} />
        <Route path="statistics" element={<AdminStatistics data={store.data} />} />
        <Route path="settings" element={<AdminSettings store={store} />} />
        {navigation.filter(([key]) => !['dashboard', 'statistics', 'settings'].includes(key)).map(([key]) => <Route key={key} path={key} element={<EntityPage key={key} section={key} store={store} />} />)}
        <Route path="*" element={<h1>Página no encontrada</h1>} />
      </Routes>}
    </AdminLayout>}
  </div>
}
