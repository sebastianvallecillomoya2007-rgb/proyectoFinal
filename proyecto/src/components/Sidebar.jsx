import { categoryLabel } from '../categories'

export default function Sidebar({ categories = [], category = 'all', counts = {}, view, onCategoryChange, onViewChange }) {
  return <aside className="discovery-sidebar" aria-label="Navegación del catálogo">
    <div className="sidebar-section"><p className="category-title">TU UNIVERSO GAMING</p><ul className="category-list">{[['discover', '◈', 'Descubrir'], ['all', '▦', 'Todos los juegos'], ['offers', '↘', 'Ofertas'], ['upcoming', '◷', 'Próximamente']].map(([id, icon, name]) => <li key={id}><button className={`category-item ${view === id && category === 'all' ? 'active' : ''}`} aria-pressed={view === id && category === 'all'} onClick={() => onViewChange(id)}><span className="sidebar-icon" aria-hidden="true">{icon}</span>{name}{id === 'offers' && <span className="tiny-dot" />}</button></li>)}</ul></div>
    <div className="sidebar-section genre-navigation"><p className="category-title">EXPLORA POR GÉNERO</p><ul className="category-list">{categories.map(item => <li key={item}><button className={`category-item ${category === item ? 'active' : ''}`} aria-pressed={category === item} onClick={() => onCategoryChange(item)}>{categoryLabel(item)}<small>{counts[item]}</small></button></li>)}</ul></div>
    <div className="sidebar-note"><span className="sidebar-note-icon">N↗</span><strong>Siempre algo por descubrir.</strong><p>Nuevos mundos, todos tus géneros y un solo lugar.</p><a href="#/registro">Únete a NEXUS →</a></div>
    <p className="sidebar-credit">POWERED BY <a href="https://rawg.io" target="_blank" rel="noreferrer">RAWG ↗</a></p>
  </aside>
}
