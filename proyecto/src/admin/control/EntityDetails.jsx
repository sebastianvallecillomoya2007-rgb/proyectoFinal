import GameImage from '../../components/GameImage'
import { DataTable, Modal } from './components'
import { labels } from './schemas'
import { money } from './model'

export default function EntityDetails({ section, row, schema, data, onClose }) {
  const sales = section === 'users' ? data.sales.filter(sale => sale.userId === row.id) : section === 'developers' ? data.sales.filter(sale => data.games.some(game => game.id === sale.gameId && game.developer === row.name)) : []
  const paid = sales.filter(sale => sale.status === 'Pagado')
  const games = section === 'developers' ? data.games.filter(game => game.developer === row.name) : []
  return <Modal title={`Detalles de ${schema.singular}`} onClose={onClose}>
    {row.image && <GameImage game={{ ...row, title: row.name }} className="ac-detail-image" alt={row.name} />}
    <dl className="ac-detail">{Object.entries(row).map(([key, value]) => <div key={key}><dt>{schema.fields.find(field => field.key === key)?.label || labels[key] || key}</dt><dd>{Array.isArray(value) ? value.map(id => data.games.find(game => game.id === id)?.name || id).join(', ') : String(value || '—')}</dd></div>)}</dl>
    {['users', 'developers'].includes(section) && <section className="ac-related"><h3>{section === 'users' ? 'Historial de compras' : 'Estadísticas del estudio'}</h3><p>{paid.length} ventas pagadas · {section === 'users' ? 'Total gastado' : 'Ingresos'}: {money(paid.reduce((sum, sale) => sum + sale.total, 0))}</p><DataTable caption="Compras relacionadas" rows={sales} columns={[{ key: 'id', label: 'Venta' }, { key: 'game', label: 'Juego' }, { key: 'date', label: 'Fecha' }, { key: 'total', label: 'Importe', render: sale => money(sale.total) }, { key: 'status', label: 'Estado' }]} />{section === 'developers' && <><h3>Juegos del desarrollador</h3><ul>{games.map(game => <li key={game.id}>{game.name} · {game.status}</li>)}</ul>{!games.length && <p>Sin juegos asociados.</p>}</>}</section>}
  </Modal>
}
