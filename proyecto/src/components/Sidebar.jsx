import { t } from '../language'
import '../css/principal.css'
import { categoryLabel } from '../categories'

export default function Sidebar({ children, categories = [], category = 'all', onCategoryChange }) {
  return (
    <aside aria-label={t("Categorías de juegos")}>
      <div>
        <div className="category-title">{t("CATEGORÍAS")}</div>
        <ul className="category-list">
          <li><button className={`category-item ${category === 'all' ? 'active' : ''}`} aria-pressed={category === 'all'} onClick={() => onCategoryChange?.('all')}>{t("Todos los juegos")}</button></li>
          {categories.map(item => <li key={item}><button className={`category-item ${category === item ? 'active' : ''}`} aria-pressed={category === item} onClick={() => onCategoryChange?.(item)}>{t(categoryLabel(item))}</button></li>)}
        </ul>
      </div>
      {t(children)}
    </aside>
  )
}
