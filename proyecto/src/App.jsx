import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import Catalog from './components/Catalog'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import FeaturedLists from './components/FeaturedLists'
import Routing from './routes/Routing'
import { api } from './auth/api'
import './css/auth.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  useEffect(() => {
    let active = true
    api('/auth/me').then(result => { if (active) setUser(result.user) })
      .catch(error => { if (active) setAuthError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function logout() {
    try {
      await api('/auth/logout', {})
      setUser(null)
      setAuthError('')
      window.location.hash = '/login'
    } catch (error) { setAuthError(error.message) }
  }

  return (
    <>
      <Navbar onSearchChange={setSearchQuery} user={user} onLogout={logout} loading={loading} />
      {authError && <p className="auth-error global-auth-error" role="alert">{authError}</p>}
      <Routing user={user} loading={loading} onAuthenticated={account => { setUser(account); setAuthError('') }}>
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
      </Routing>
    </>
  )
}

export default App
