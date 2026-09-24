import { useEffect, useState } from 'react'
import { api } from '../auth/api'
import GameCard from '../components/GameCard'

export default function WishlistPage({ user }) {
  const [games, setGames] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!user) return
    let active = true
    api('/wishlist').then(result => { if (active) { setGames(result.games); setError('') } }).catch(error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [user, revision])
  async function remove(game) {
    if (busy) return
    setBusy(game.id); setError('')
    try { await api('/wishlist', { gameId: game.id, saved: false }); setGames(items => items.filter(item => item.id !== game.id)) }
    catch (error) { setError(error.message) } finally { setBusy('') }
  }
  return <main className="wishlist-page"><span className="auth-eyebrow">TU COLECCIÓN PERSONAL</span><h1>Lista de deseados</h1><p className="auth-description">Guarda los juegos que quieres descubrir y vuelve a ellos cuando quieras.</p>
    {!user ? <section className="game-panel"><h2>Tus próximas aventuras, en un solo lugar</h2><p className="auth-description">Inicia sesión para guardar tu lista en tu cuenta.</p><a className="btn-buy" href="#/login?next=%2Fdeseados">Iniciar sesión</a></section> : <>
      {error && <div className="auth-error" role="alert">{error} <button className="btn-redeem" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
      {!games && !error && <p role="status">Cargando tus juegos…</p>}
      {games?.length === 0 && <section className="game-panel empty-reviews"><span aria-hidden="true">♡</span><h2>Tu lista comienza con un juego</h2><p>Abre su ficha y pulsa «Añadir a deseados».</p><a className="btn-buy" href="#/">Explorar la tienda</a></section>}
      <div className="games-grid">{games?.map(game => <div className="wishlist-item" key={game.id}><GameCard game={game} /><button className="wishlist-remove" disabled={Boolean(busy)} onClick={() => remove(game)}>{busy === game.id ? 'Quitando…' : 'Quitar de deseados'}</button></div>)}</div>
    </>}
  </main>
}
