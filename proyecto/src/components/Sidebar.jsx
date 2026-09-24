import '../css/principal.css'

export default function Sidebar({ children }) {
  return (
    <aside>
      <div>
        <div className="category-title">CATEGORIES</div>
        <ul className="category-list">
          <li><a href="#/" className="category-item active"><i className="fa-solid fa-border-all"></i> principal</a></li>
          <li><a href="All-games.html" className="category-item"><i className="fa-solid fa-border-all"></i> All Games</a></li>
          <li><a href="Action.html" className="category-item"><i className="fa-solid fa-bolt"></i> Action</a></li>
          <li><a href="rpg.html" className="category-item"><i className="fa-solid fa-shield-halved"></i> RPG</a></li>
          <li><a href="indie.html" className="category-item"><i className="fa-solid fa-wand-magic-sparkles"></i> Indie</a></li>
          <li><a href="Sci-Fi.html" className="category-item"><i className="fa-solid fa-rocket"></i> Sci-Fi</a></li>
          <li><a href="Horror.html" className="category-item"><i className="fa-solid fa-skull"></i> Horror</a></li>
        </ul>
      </div>
      {children}
    </aside>
  )
}
