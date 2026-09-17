import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'

function App() {
  return (
    <>
      <Navbar />
      <div className="container">
        <main className="store-home">
          <HeroSection />
        </main>
      </div>
    </>
  )
}

export default App
