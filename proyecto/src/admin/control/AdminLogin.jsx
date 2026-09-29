import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { accounts } from './model'
import BrandLogo from '../../components/BrandLogo'

export default function AdminLogin({ store }) {
  const [error, setError] = useState('')
  const navigate = useNavigate()
  if (store.session) return <Navigate to="/admin" replace />
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try { store.login(form.get('email'), form.get('password')); navigate('/admin', { replace: true }) }
    catch (error) { setError(error.message) }
  }
  return <main className="ac-login"><section><Link className="ac-brand" to="/"><BrandLogo /></Link><p className="ac-eyebrow">ADMINISTRACIÓN</p><h1>Todo tu universo.<br /><span>Bajo control.</span></h1><p>Gestiona el catálogo, descubre tendencias y cuida de tu comunidad desde un solo lugar.</p><div className="ac-login-grid"><span>◧ Catálogo</span><span>↗ Estadísticas</span><span>♙ Comunidad</span></div><Link to="/">← Volver a la tienda</Link></section><section className="ac-panel"><span className="ac-badge ac-warning">PROTOTIPO FRONTEND</span><h2>Acceso administrativo</h2><p>Sesión simulada: no proporciona seguridad real ni acceso a los datos de la tienda.</p><form onSubmit={submit}><label>Correo electrónico<input name="email" type="email" required autoComplete="username" placeholder="superadmin@nexus.demo" /></label><label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>{error && <p className="ac-error" role="alert">{error}</p>}<button className="ac-primary" type="submit">Iniciar sesión →</button></form><details><summary>Credenciales de demostración</summary><p>Contraseña para todos: <code>NexusDemo2026!</code></p>{accounts.map(account => <p key={account.email}><strong>{account.role}</strong><br />{account.email}</p>)}</details></section></main>
}
