import { useState } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import Catalog from './components/Catalog'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import FeaturedLists from './components/FeaturedLists'

function App() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <Navbar onSearchChange={setSearchQuery} />
      <div className="container">
        <Sidebar>
          <Footer />
        </Sidebar>
        <main className="store-home">
          <HeroSection />
          <Catalog searchQuery={searchQuery} />
          <FeaturedLists />
        </main>
      </div>
    </>
  )
}

export default App
