import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import GameImage from '../../components/GameImage'
import { ConfirmModal, DataTable, StatusBadge } from './components'
import EntityForm from './EntityForm'
import EntityDetails from './EntityDetails'
import { labels, schemas } from './schemas'
import { displayDate, money } from './model'

export default function EntityPage({ section, store }) {
  const { data, commit } = store
  const schema = schemas[section]
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(null)
  const [details, setDetails] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const selected = params.get('record')
  const detailRow = data[section].find(row => row.id === (details || selected))
  const rows = data[section].map(row => {
    if (section === 'users') return { ...row, purchases: data.sales.filter(sale => sale.userId === row.id && sale.status === 'Pagado').length }
    if (section === 'developers') {
      const games = data.games.filter(game => game.developer === row.name)
      const sales = data.sales.filter(sale => sale.status === 'Pagado' && games.some(game => game.id === sale.gameId))
      return { ...row, gameCount: games.length, units: sales.length, revenue: sales.reduce((sum, sale) => sum + sale.total, 0) }
    }
    return row
  })
  const filtered = rows.filter(row => Object.values(row).join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()) && schema.filters.every(key => !filters[key] || String(row[key]) === filters[key]) && (!filters.from || row[schema.dateKey] >= filters.from) && (!filters.to || row[schema.dateKey] <= filters.to))
  const pages = Math.max(1, Math.ceil(filtered.length / 8))
  const currentPage = Math.min(page, pages)
  const changeFilter = (key, value) => { setFilters({ ...filters, [key]: value }); setPage(1) }
  function save(record) {
    const existing = data[section].find(row => row.id === record.id)
    if (['categories', 'developers'].includes(section) && data[section].some(row => row.id !== record.id && row.name.toLocaleLowerCase() === record.name.toLocaleLowerCase())) return false
    const success = commit(section, next => {
      const row = { ...record, id: record.id || crypto.randomUUID() }
      next[section] = existing ? next[section].map(item => item.id === row.id ? row : item) : [row, ...next[section]]
      if (existing && section === 'developers') next.games = next.games.map(game => game.developer === existing.name ? { ...game, developer: record.name } : game)
      if (existing && section === 'categories') next.games = next.games.map(game => ({ ...game, category: game.category === existing.name ? record.name : game.category, genre: game.genre === existing.name ? record.name : game.genre, tags: game.tags.split(',').map(tag => tag.trim() === existing.name ? record.name : tag.trim()).join(', ') }))
      return next
    }, existing ? `Editó ${schema.singular}` : `Creó ${schema.singular}`, record.name || record.id)
    if (success) setForm(null)
    return success
  }
  function perform(row, label, status) {
    const execute = () => {
      const success = commit(section, next => {
        next[section] = status ? next[section].map(item => item.id === row.id ? { ...item, status } : item) : next[section].filter(item => item.id !== row.id)
        if (section === 'refunds' && status === 'Aprobado') {
          next.sales = next.sales.map(sale => sale.id === row.saleId ? { ...sale, status: 'Reembolsado' } : sale)
          next.payments = next.payments.map(payment => payment.saleId === row.saleId ? { ...payment, status: 'Reembolsado' } : payment)
        }
        if (section === 'categories' && !status) next.games = next.games.map(game => ({ ...game, category: game.category === row.name ? 'Sin categoría' : game.category, tags: game.tags.split(',').filter(tag => tag.trim() !== row.name).join(', ') }))
        return next
      }, `${label}: ${schema.singular}`, row.name || row.id)
      if (success) setConfirmation(null)
    }
    if (!status || ['Bloquear', 'Desactivar', 'Ocultar'].includes(label) || section === 'refunds') setConfirmation({ title: `¿${label} ${row.name || row.id}?`, execute })
    else execute()
  }
  const columns = schema.columns.map(key => ({ key, label: labels[key] || key, render: row => key === 'status' ? <StatusBadge>{row.status}</StatusBadge> : key === 'name' && section === 'games' ? <div className="ac-game-cell"><GameImage game={{ ...row, title: row.name }} alt={row.name} /><strong>{row.name}</strong></div> : key === 'name' && section === 'notifications' ? <strong><span aria-hidden="true">{row.status === 'No leída' ? '●' : '○'} </span>{row.name}</strong> : ['date', 'start', 'end', 'lastAccess'].includes(key) ? displayDate(row[key], data.settings) : ['price', 'oldPrice', 'total', 'revenue'].includes(key) ? money(row[key]) : key === 'games' ? row.games.map(id => data.games.find(game => game.id === id)?.name || 'Juego eliminado').join(', ') : key === 'score' ? `★ ${row.score}/5` : row[key] }))
  return <><div className="ac-page-heading"><div><p className="ac-eyebrow">ADMINISTRACIÓN</p><h1>{schema.title}<span>.</span></h1><p>{schema.description}</p></div>{schema.create && <button className="ac-primary" onClick={() => setForm({})}>+ Agregar {schema.singular}</button>}{section === 'notifications' && <button onClick={() => commit(section, next => { next.notifications = next.notifications.map(row => ({ ...row, status: 'Leída' })); return next }, 'Marcó todas como leídas', 'Notificaciones')}>Marcar todas como leídas</button>}</div>
    <section className="ac-panel"><div className="ac-filters"><label>Buscar<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder={`Buscar ${schema.title.toLowerCase()}…`} /></label>{schema.filters.map(key => <label key={key}>{labels[key]}<select value={filters[key] || ''} onChange={event => changeFilter(key, event.target.value)}><option value="">Todos</option>{[...new Set(rows.map(row => row[key]))].sort().map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}{schema.dateKey && <><label>Desde<input type="date" value={filters.from || ''} onChange={event => changeFilter('from', event.target.value)} /></label><label>Hasta<input type="date" min={filters.from} value={filters.to || ''} onChange={event => changeFilter('to', event.target.value)} /></label></>}<button onClick={() => { setFilters({}); setQuery(''); setPage(1); setParams({}) }}>Limpiar filtros</button></div>
    {filters.from && filters.to && filters.from > filters.to && <p className="ac-error" role="alert">La fecha inicial debe ser anterior a la final.</p>}
    <DataTable caption={`${filtered.length} registros · ${schema.title}`} columns={columns} rows={filtered.slice((currentPage - 1) * 8, currentPage * 8)} actions={row => <><button onClick={() => setDetails(row.id)}>{section === 'users' ? 'Ver perfil' : section === 'developers' ? 'Ver juegos' : 'Ver'}</button>{schema.edit && <button onClick={() => setForm(data[section].find(item => item.id === row.id))}>Editar</button>}{schema.actions?.filter(([, status]) => status !== row.status && (section !== 'refunds' || row.status === 'Pendiente')).map(([label, status]) => <button key={label} onClick={() => perform(row, label, status)}>{label}</button>)}{schema.remove && <button className="ac-danger" onClick={() => perform(row, 'Eliminar')}>Eliminar</button>}</>} />
    <div className="ac-pagination"><span>{currentPage} / {pages}</span><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div></section>
    {form && <EntityForm schema={schema} record={form.id ? form : null} data={data} onSave={save} onClose={() => setForm(null)} />}
    {detailRow && <EntityDetails section={section} row={detailRow} schema={schema} data={data} onClose={() => { setDetails(null); setParams({}) }} />}
    {confirmation && <ConfirmModal title={confirmation.title} onConfirm={confirmation.execute} onClose={() => setConfirmation(null)} />}
  </>
}
