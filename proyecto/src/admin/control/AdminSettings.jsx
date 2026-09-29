import { useState } from 'react'
import { accounts, navigation, roles } from './model'

const groups = [
  ['Información de la tienda', [['name', 'Nombre', 'text'], ['logo', 'Logo (URL)', 'url'], ['favicon', 'Favicon (URL)', 'url'], ['email', 'Correo', 'email'], ['currency', 'Moneda del catálogo', ['USD']], ['language', 'Idioma del panel', ['Español']]]],
  ['Preferencias administrativas', [['theme', 'Tema', ['Oscuro', 'Medianoche']], ['notifications', 'Notificaciones de acciones nuevas', ['Activadas', 'Desactivadas']], ['dateFormat', 'Formato de fecha', ['DD/MM/YYYY', 'YYYY-MM-DD']], ['timezone', 'Zona horaria', ['America/Costa_Rica', 'America/Mexico_City', 'Europe/Madrid', 'UTC']]]],
  ['Políticas', [['privacy', 'Política de privacidad', 'textarea'], ['terms', 'Términos y condiciones', 'textarea'], ['refundPolicy', 'Política de reembolso', 'textarea']]],
]
export default function AdminSettings({ store }) {
  const [values, setValues] = useState(store.data.settings)
  const [saved, setSaved] = useState(false)
  function submit(event) {
    event.preventDefault()
    if (store.commit('settings', next => { next.settings = values; return next }, 'Actualizó configuración', values.name)) setSaved(true)
  }
  return <><div className="ac-page-heading"><div><p className="ac-eyebrow">TU WORKSPACE</p><h1>Configuración<span>.</span></h1><p>Los cambios afectan únicamente al panel y al contenido simulado. El catálogo público permanece independiente.</p></div></div><form onSubmit={submit}>{groups.map(([title, fields]) => <section className="ac-panel" key={title}><h2>{title}</h2><div className="ac-form-grid ac-settings-fields">{fields.map(([key, label, type]) => <label key={key} className={type === 'textarea' ? 'ac-form-wide' : ''}>{label}{Array.isArray(type) ? <select value={values[key]} onChange={event => { setValues({ ...values, [key]: event.target.value }); setSaved(false) }}>{type.map(option => <option key={option}>{option}</option>)}</select> : type === 'textarea' ? <textarea value={values[key]} onChange={event => { setValues({ ...values, [key]: event.target.value }); setSaved(false) }} /> : <input type={type} required={['name', 'email'].includes(key)} value={values[key]} onChange={event => { setValues({ ...values, [key]: event.target.value }); setSaved(false) }} />}</label>)}</div></section>)}<div className="ac-actions">{saved && <span role="status">Configuración guardada.</span>}<button className="ac-primary" type="submit">Guardar configuración</button></div></form>
    <section className="ac-panel ac-role-panel"><h2>Roles y permisos de demostración</h2><p>Para probar otro rol, cierra la sesión administrativa y entra con su cuenta. Contraseña compartida: <code>NexusDemo2026!</code></p><div className="ac-table-wrap"><table><caption>Permisos por cuenta de demostración</caption><thead><tr><th>Rol</th><th>Correo</th><th>Secciones autorizadas</th></tr></thead><tbody>{accounts.map(account => <tr key={account.email}><td>{account.role}</td><td>{account.email}</td><td>{roles[account.role].map(key => key === '*' ? 'Todas' : key === 'reports' ? 'Reportes de reseñas' : navigation.find(([id]) => id === key)?.[1]).join(', ')}</td></tr>)}</tbody></table></div><p>El control de acceso es una simulación del frontend; una API futura deberá autenticar y autorizar cada operación.</p></section>
  </>
}
