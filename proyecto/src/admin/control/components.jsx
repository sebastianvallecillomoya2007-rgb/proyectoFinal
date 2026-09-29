import { useEffect, useId, useRef } from 'react'

export function StatusBadge({ children }) {
  const tone = ['Publicado', 'Activo', 'Activa', 'Pagado', 'Completado', 'Aprobado', 'Aprobada', 'Leída'].includes(children) ? 'good' : ['Pendiente', 'Programada', 'Reportada', 'No leída'].includes(children) ? 'warning' : 'muted'
  return <span className={`ac-badge ac-${tone}`}>{children}</span>
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null)
  const id = useId()
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    return () => { dialog.close(); previous?.focus() }
  }, [])
  return <dialog className="ac-modal" ref={ref} aria-labelledby={id} onCancel={onClose}>
    <div className="ac-modal-heading"><h2 id={id}>{title}</h2><button type="button" aria-label="Cerrar ventana" onClick={onClose}>×</button></div>
    {children}
  </dialog>
}
export function ConfirmModal({ title, onConfirm, onClose }) {
  return <Modal title={title} onClose={onClose}><p>La acción se aplicará a los datos de demostración de este navegador. Las eliminaciones no se pueden deshacer.</p><div className="ac-actions"><button autoFocus onClick={onClose}>Cancelar</button><button className="ac-danger" onClick={onConfirm}>Confirmar</button></div></Modal>
}
export function StatCard({ label, value, detail }) {
  return <article className="ac-stat"><span>{label}</span><strong>{value}</strong><small>{detail || 'Datos de demostración'}</small></article>
}
export function EmptyState() { return <div className="ac-empty"><span aria-hidden="true">⌕</span><h3>No se encontraron resultados</h3><p>Prueba otra búsqueda o limpia los filtros.</p></div> }
export function DataTable({ columns, rows, actions, caption }) {
  return <div className="ac-table-wrap"><table><caption>{caption}</caption><thead><tr>{columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}{actions && <th scope="col">Acciones</th>}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{columns.map(column => <td key={column.key} data-label={column.label}>{column.render ? column.render(row) : String(row[column.key] ?? '—')}</td>)}{actions && <td data-label="Acciones"><div className="ac-row-actions">{actions(row)}</div></td>}</tr>)}</tbody></table>{!rows.length && <EmptyState />}</div>
}
