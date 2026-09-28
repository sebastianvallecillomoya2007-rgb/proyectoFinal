import { t } from '../language'
import { useState } from 'react'
import { api } from './api'

export default function AuthPage({ mode, onAuthenticated, next }) {
  const register = mode === 'register'
  const admin = mode === 'admin'
  const returnTo = typeof next === 'string' && (next.startsWith('/juego/') || next === '/deseados') ? next : '/cuenta'
  const nextQuery = next ? '?next=' + encodeURIComponent(returnTo) : ''
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (register && values.password !== values.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    try {
      const { user } = await api(`/auth/${register ? 'register' : admin ? 'admin-login' : 'login'}`, values)
      onAuthenticated(user)
      window.location.hash = user.role === 'admin' ? '/admin' : returnTo
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }

  return (
    <main className={`auth-page ${admin ? 'auth-admin' : ''}`}>
      <div className="auth-intro">
        <span className="auth-eyebrow">{admin ? t('NEXUS CONTROL') : t('TU PRÓXIMA PARTIDA EMPIEZA AQUÍ')}</span>
        <h1>{admin ? t('Acceso de administradores') : register ? t('Únete a NEXUS GAMES') : t('Bienvenido de vuelta')}</h1>
        <p>{admin ? t('Accede al panel para consultar las cuentas de la comunidad.') : t('Descubre tu próximo juego, guarda tus favoritos y comparte tu experiencia con la comunidad.')}</p>
        {!admin && <ul className="auth-perks"><li><span aria-hidden="true">{t("◇")}</span>{t("Un universo de juegos por descubrir")}</li><li><span aria-hidden="true">{t("♡")}</span>{t("Tus favoritos, siempre a mano")}</li><li><span aria-hidden="true">{t("☆")}</span>{t("Tu experiencia cuenta")}</li></ul>}
        <a href="#/" className="auth-link">{t("← Volver a la tienda")}</a>
      </div>
      <section className="auth-card" aria-labelledby="form-title">
        <span className="auth-badge">{admin ? t('ADMINISTRACIÓN') : t('JUGADORES')}</span>
        <h2 id="form-title">{register ? t('Crear cuenta') : t('Iniciar sesión')}</h2>
        <p className="auth-description">{admin ? t('Usa tu cuenta de administrador. Este acceso no permite registros.') : register ? t('Completa tus datos para comenzar.') : t('Ingresa tus datos para acceder a tu cuenta.')}</p>
        <form onSubmit={submit} className="auth-form">
          {register && <label htmlFor="name">{t("Nombre completo")}<input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>}
          <label htmlFor="email">{t("Correo electrónico")}<input id="email" name="email" type="email" autoComplete="username" required maxLength={254} placeholder={t("tu@correo.com")} /></label>
          <label htmlFor="password">{t("Contraseña")}<input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} aria-describedby={register ? 'password-help' : undefined} /></label>
          {register && <><p id="password-help" className="auth-description">{t("Usa entre 8 y 128 caracteres.")}</p><label htmlFor="confirmPassword">{t("Confirmar contraseña")}<input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} /></label></>}
          <label className="auth-checkbox"><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />{t(" Mostrar contraseña")}</label>
          {error && <p className="auth-error" role="alert">{t(error)}</p>}
          <button className="btn-buy auth-submit" disabled={busy}>{busy ? t('Procesando…') : register ? t('Crear mi cuenta') : admin ? t('Entrar al panel') : t('Iniciar sesión')}</button>
        </form>
        {!admin && <p className="auth-switch">{register ? t('¿Ya tienes una cuenta?') : t('¿Aún no tienes cuenta?')} <a href={(register ? '#/login' : '#/registro') + nextQuery}>{register ? t('Inicia sesión') : t('Crear cuenta')}</a></p>}
        <a className="auth-secondary" href={admin ? '#/login' : '#/admin/login'}>{admin ? t('Acceso para clientes') : t('Acceso para administradores')}</a>
      </section>
    </main>
  )
}
