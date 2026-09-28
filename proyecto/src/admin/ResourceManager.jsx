import { t } from '../language'
import { useEffect, useRef, useState } from 'react'
import { automationStatus, deleteRecord, listRecords, retryAutomations, saveRecord } from '../service/adminService'

const schemas = {
  users: { label: 'Usuarios', fields: [['name', 'Nombre'], ['email', 'Correo', 'email'], ['role', 'Rol', 'role'], ['password', 'Contraseña', 'password']] },
  games: { label: 'Juegos', fields: [['title', 'Título'], ['category', 'Categoría'], ['description', 'Descripción', 'optional'], ['image', 'URL de imagen', 'url'], ['basePrice', 'Precio normal (USD)', 'number'], ['isOffer', 'Oferta activa', 'checkbox'], ['price', 'Precio de oferta (USD)', 'number'], ['isUpcoming', 'Próximo lanzamiento', 'checkbox']] },
  orders: { label: 'Compras de prueba', fields: [['userId', 'Cliente', 'users'], ['gameId', 'Juego', 'games'], ['quantity', 'Cantidad', 'integer']] },
  wishlist: { label: 'Deseados', fields: [['userId', 'Cliente', 'users'], ['gameId', 'Juego', 'games']] },
  reviews: { label: 'Reseñas', fields: [['userId', 'Cliente', 'users'], ['gameId', 'Juego', 'games'], ['rating', 'Puntuación (1–5)', 'rating'], ['text', 'Reseña']] },
}
const initial = { name: '', email: '', role: 'client', password: '', title: '', category: 'indie', description: '', image: '', basePrice: 0, price: 0, isOffer: false, isUpcoming: false, quantity: 1, rating: 5, text: '', userId: '', gameId: '' }

export default function ResourceManager({ onClose, onChanged }) {
  const dialog = useRef(null)
  const [resource, setResource] = useState('users')
  const [records, setRecords] = useState([])
  const [references, setReferences] = useState({ users: [], games: [] })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initial)
  const [revision, setRevision] = useState(0)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [removing, setRemoving] = useState(null)
  const [automation, setAutomation] = useState(null)
  useEffect(() => {
    const node = dialog.current
    const previous = document.activeElement
    node.showModal()
    return () => { node.close(); previous?.focus() }
  }, [])
  useEffect(() => {
    let active = true
    Promise.all([listRecords(resource), listRecords('users'), listRecords('games'), automationStatus()]).then(([items, users, games, status]) => {
      if (active) { setRecords(items); setReferences({ users: users.filter(user => user.role === 'client'), games }); setAutomation(status); setLoading(false) }
    }).catch(error => { if (active) { setError(error.message); setLoading(false) } })
    return () => { active = false }
  }, [resource, revision])
  function reset() { setEditing(null); setForm(initial); setRemoving(null) }
  function refresh() { setLoading(true); setRevision(value => value + 1); onChanged() }
  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    const values = Object.fromEntries(schemas[resource].fields.map(([key]) => [key, form[key]]))
    if (resource === 'users' && editing && !values.password) delete values.password
    try { await saveRecord(resource, values, editing); reset(); setNotice('Registro guardado.'); refresh() }
    catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  async function remove() {
    if (busy) return
    setBusy(true); setError('')
    try { await deleteRecord(resource, removing); reset(); setPage(0); setNotice('Registro eliminado.'); refresh() }
    catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="settings-dialog" aria-labelledby="resource-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="settings-heading"><h2 id="resource-title">{t("Gestionar registros")}</h2><button type="button" aria-label={t("Cerrar gestión")} disabled={busy} onClick={onClose}>{t("×")}</button></div>
    <div className="settings-fields"><label htmlFor="resource-type">{t("Recurso")}<select id="resource-type" value={resource} disabled={busy} onChange={event => { setResource(event.target.value); reset(); setPage(0); setError(''); setNotice(''); setLoading(true) }}>{Object.entries(schemas).map(([value, schema]) => <option key={value} value={value}>{t(schema.label)}</option>)}</select></label></div>
    {error && <p className="auth-error" role="alert">{t(error)}</p>}
    {notice && <p className="commerce-success" role="status">{t(notice)}</p>}
    {loading ? <p role="status">{t("Cargando registros…")}</p> : <>
      <div className="admin-table-wrapper"><table className="admin-table"><caption>{t(schemas[resource].label)}{t(": ")}{t(records.length)}{t(" registros")}</caption><thead><tr><th scope="col">{t("Registro")}</th><th scope="col">{t("Acciones")}</th></tr></thead><tbody>{records.slice(page * 10, page * 10 + 10).map(record => <tr key={record.id}><td>{record.name || record.title || references.games.find(game => game.id === record.gameId)?.title || record.id}{record.email && <small>{t(" · ")}{record.email}</small>}{record.userId && <small>{t(" · ")}{references.users.find(user => user.id === record.userId)?.name || t(record.userId)}</small>}</td><td><button className="btn-redeem" disabled={busy} onClick={() => { setEditing(record.id); setForm({ ...initial, ...record, password: '' }); setRemoving(null); setNotice('') }}>{t("Editar")}</button> <button className="btn-redeem" disabled={busy} onClick={() => setRemoving(record.id)}>{t("Eliminar")}</button></td></tr>)}</tbody></table></div>
      <div className="settings-actions"><button className="btn-redeem" disabled={page === 0 || busy} onClick={() => setPage(value => value - 1)}>{t("Anterior")}</button><span>{t("Página ")}{t(page + 1)}{t(" de ")}{t(Math.max(1, Math.ceil(records.length / 10)))}</span><button className="btn-redeem" disabled={(page + 1) * 10 >= records.length || busy} onClick={() => setPage(value => value + 1)}>{t("Siguiente")}</button></div>
    </>}
    {removing && <section className="auth-card" aria-label={t("Confirmar eliminación")}><p>{t("¿Eliminar este registro? Esta acción no se puede deshacer.")}</p><div className="settings-actions"><button className="btn-redeem" disabled={busy} onClick={() => setRemoving(null)}>{t("Cancelar eliminación")}</button><button className="btn-buy" disabled={busy} onClick={remove}>{t("Confirmar eliminación")}</button></div></section>}
    <form className="auth-form settings-fields" onSubmit={save}>
      <h3>{editing ? t('Editar registro') : t('Crear registro')}</h3>
      {resource === 'orders' && <p>{t("Las compras son de prueba. El total se calcula con el precio del juego; las compras anteriores conservan su precio unitario.")}</p>}
      {schemas[resource].fields.map(([key, label, type = 'text']) => <label key={key} htmlFor={'record-' + key} className={type === 'checkbox' ? 'auth-checkbox' : undefined}>{t(label)}
        {['role', 'users', 'games'].includes(type) ? <select id={'record-' + key} required value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} disabled={busy}>
          {type === 'role' ? <><option value="client">{t("Cliente")}</option><option value="admin">{t("Administrador")}</option></> : <><option value="">{t("Seleccionar…")}</option>{references[type].map(item => <option key={item.id} value={item.id}>{item.name || item.title}</option>)}</>}
        </select> : <input id={'record-' + key} type={['integer', 'rating'].includes(type) ? 'number' : type === 'optional' ? 'text' : type} value={type === 'checkbox' ? undefined : form[key] ?? ''} checked={type === 'checkbox' ? form[key] : undefined} disabled={busy} required={!['checkbox', 'optional', 'url'].includes(type) && !(type === 'password' && editing)} min={type === 'number' ? 0 : 1} max={type === 'rating' ? 5 : type === 'integer' ? 100 : undefined} step={type === 'number' ? '0.01' : 1} minLength={type === 'password' ? 8 : undefined} maxLength={type === 'password' ? 128 : key === 'text' ? 2000 : key === 'description' ? 10000 : undefined} autoComplete={type === 'password' ? 'new-password' : undefined} onChange={event => setForm({ ...form, [key]: type === 'checkbox' ? event.target.checked : ['number', 'integer', 'rating'].includes(type) ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value })} />}
      </label>)}
      {resource === 'users' && editing && <p>{t("Deja la contraseña vacía para conservar la actual.")}</p>}
      <div className="settings-actions"><button type="button" className="btn-redeem" disabled={busy} onClick={reset}>{t("Nuevo / cancelar edición")}</button><button className="btn-buy" disabled={busy || loading}>{busy ? t('Guardando…') : t('Guardar registro')}</button></div>
    </form>
    <details><summary>{t("Automatizaciones de registro y compra")}</summary>{automation && <>
      <p>{t("Registro: ")}{automation.configured.registration ? t('conectado') : t('pendiente de configurar')}{t(". Compras: ")}{automation.configured.purchase ? t('conectado') : t('pendiente de configurar')}{t(".")}</p>
      <ul>{automation.events.map(event => <li key={event.id}>{event.type === 'user.registered' ? t('Registro') : t('Compra')}{t(": ")}{t(({ delivered: 'entregado', pending: 'pendiente', failed: 'falló' })[event.status])}{event.error ? t(' · ' + event.error) : t('')}</li>)}</ul>
      <button type="button" className="btn-redeem" disabled={busy} onClick={async () => { setBusy(true); try { setAutomation(await retryAutomations()) } catch (error) { setError(error.message) } finally { setBusy(false) } }}>{t("Reintentar pendientes")}</button>
    </>}</details>
  </dialog>
}
