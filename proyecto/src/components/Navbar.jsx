import { useState } from 'react'
import '../css/principal.css'

export default function Navbar({ onSearchChange }) {
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearchChange(event) {
    const value = event.target.value
    setSearchQuery(value)
    onSearchChange?.(value.toLowerCase().trim())
  }

  return (
    <header>
      <div className="logo">NEXUS GAMES</div>
      <nav>
        <a href="principal.html" className="active">Store</a>
        <a href="#">Library</a>
        <a href="#">Community</a>
        <a href="#">Profile</a>
      </nav>
      <div className="header-actions">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            id="searchInput"
            placeholder="Search games..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="user-icons">
          <i className="fa-solid fa-bell"></i>
          <i className="fa-solid fa-gear"></i>
          <i className="fa-solid fa-user-ninja"></i>
        </div>
      </div>
    </header>
  )
}
