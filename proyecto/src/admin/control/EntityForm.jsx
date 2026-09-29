import { useState } from 'react'
import { Modal } from './components'

export default function EntityForm({ schema, record, data, onSave, onClose }) {
  const [values, setValues] = useState(() => Object.fromEntries(schema.fields.map(field => [field.key, record?.[field.key] ?? (field.options?.[0] || (field.type === 'games' ? [] : field.type === 'number' ? 0 : ''))])))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  function submit(event) {
    event.preventDefault()
    const blank = schema.fields.find(field => field.required && (Array.isArray(values[field.key]) ? !values[field.key].length : !String(values[field.key]).trim()))
    if (blank) { setError(`${blank.label} es obligatorio.`); return }
    if (values.end && values.start > values.end) { setError('La fecha final debe ser igual o posterior al inicio.'); return }
    if (values.type === 'Cupón' && !values.code?.trim()) { setError('Introduce el código del cupón.'); return }
    if (values.type === 'Descuento individual' && values.games.length !== 1) { setError('Un descuento individual debe incluir exactamente un juego.'); return }
    if (values.type === 'Bundle' && values.games.length < 2) { setError('Un bundle debe incluir al menos dos juegos.'); return }
    if (values.screenshots && values.screenshots.split('\n').some(url => url.trim() && !/^https?:\/\/\S+$/i.test(url.trim()))) { setError('Cada screenshot debe ser una URL HTTP o HTTPS válida.'); return }
    const invalidUrl = schema.fields.find(field => field.type === 'url' && values[field.key] && !/^https?:\/\/\S+$/i.test(values[field.key]))
    if (invalidUrl) { setError(`${invalidUrl.label}: utiliza una URL HTTP o HTTPS.`); return }
    if (['categoría o etiqueta', 'desarrollador'].includes(schema.singular)) {
      const collection = schema.singular === 'desarrollador' ? data.developers : data.categories
      if (collection.some(row => row.id !== record?.id && row.name.toLocaleLowerCase() === values.name.trim().toLocaleLowerCase())) { setError('Ya existe un registro con ese nombre.'); return }
    }
    setSaving(true)
    const next = Object.fromEntries(schema.fields.map(field => [field.key, field.type === 'number' ? Number(values[field.key]) : typeof values[field.key] === 'string' ? values[field.key].trim() : values[field.key]]))
    if (!onSave({ ...record, ...next })) { setError('No se pudo guardar. Revisa el aviso de almacenamiento.'); setSaving(false) }
  }
  return <Modal title={`${record ? 'Editar' : 'Agregar'} ${schema.singular}`} onClose={onClose}><form onSubmit={submit}><div className="ac-form-grid">{schema.fields.map(field => {
    const choices = field.options?.map(value => ({ value, label: value })) || (field.type === 'developer' ? data.developers.filter(row => row.status === 'Activo').map(row => ({ value: row.name, label: row.name })) : field.type === 'category' ? data.categories.filter(row => row.type !== 'Etiqueta' && row.status === 'Activo').map(row => ({ value: row.name, label: row.name })) : ['game', 'games'].includes(field.type) ? data.games.map(row => ({ value: row.id, label: row.name })) : null)
    if (choices && field.type !== 'games' && values[field.key] && !choices.some(choice => choice.value === values[field.key])) choices.push({ value: values[field.key], label: `${values[field.key]} (actual)` })
    const props = { name: field.key, required: field.required, value: values[field.key], onChange: event => setValues({ ...values, [field.key]: field.type === 'games' ? Array.from(event.target.selectedOptions, option => option.value) : event.target.value }) }
    return <label key={field.key} className={field.type === 'textarea' || field.type === 'games' ? 'ac-form-wide' : ''}>{field.label}{field.required ? ' *' : ''}{choices ? <select {...props} multiple={field.type === 'games'}>{field.type !== 'games' && <option value="">Seleccionar…</option>}{choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select> : field.type === 'textarea' ? <textarea {...props} /> : <input {...props} type={field.type} min={field.min} max={field.max} step={field.type === 'number' ? '0.01' : undefined} maxLength={field.type === 'text' ? 250 : undefined} />}{field.type === 'games' && <small>Usa Ctrl o Cmd para seleccionar varios juegos.</small>}</label>
  })}</div>{error && <p className="ac-error" role="alert">{error}</p>}<div className="ac-actions"><button type="button" onClick={onClose}>Cancelar</button><button className="ac-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></div></form></Modal>
}
