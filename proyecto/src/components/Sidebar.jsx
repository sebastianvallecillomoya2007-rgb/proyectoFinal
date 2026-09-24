import '../css/principal.css'
import { categoryLabel } from '../categories'

export default function Sidebar({ children, categories = [], category = 'all', onCategoryChange }) {
  return (
    <aside>
      <div>
        <div className="category-title">CATEGORÍAS</div>
        <ul className="category-list">
          <li><button className={`category-item ${category === 'all' ? 'active' : ''}`} aria-pressed={category === 'all'} onClick={() => onCategoryChange?.('all')}>Todos los juegos</button></li>
          {categories.map(item => <li key={item}><button className={`category-item ${category === item ? 'active' : ''}`} aria-pressed={category === item} onClick={() => onCategoryChange?.(item)}>{categoryLabel(item)}</button></li>)}
        </ul>
      </div>
      {children}
    </aside>
  )
}
