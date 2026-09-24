import { useEffect, useRef, useState } from 'react'
import { api } from '../auth/api'

export default function PurchaseDialog({ game, onClose, onPurchased }) {
  const dialog = useRef(null)
  const [requestId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const { order } = await api('/orders', { gameId: game.id, expectedPrice: game.price, requestId })
      onPurchased(order)
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="purchase-dialog auth-card" aria-labelledby="purchase-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <span className="auth-eyebrow">NEXUS CHECKOUT</span>
    <h2 id="purchase-title">Confirmar compra de prueba</h2>
    <p className="auth-description">Esta operación se registrará en las estadísticas. No se realizará ningún cobro.</p>
    <p>{game.title}</p><p className="purchase-total">Total: ${game.price.toFixed(2)} USD</p>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <div className="purchase-actions"><button className="btn-redeem" onClick={onClose} disabled={busy}>Cancelar</button><button className="btn-buy" onClick={confirm} disabled={busy}>{busy ? 'Registrando…' : 'Confirmar compra de prueba'}</button></div>
  </dialog>
}
