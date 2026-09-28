import { t } from '../language'
import { useEffect, useRef, useState } from 'react'
import { api } from '../auth/api'

const defaults = { fit: 'cover', zoom: 1, x: 50, y: 50 }

export default function ProfileImageEditor({ target, source, settings, onSaved, onClose }) {
  const [options, setOptions] = useState(() => ({ ...defaults, ...settings }))
  const [image, setImage] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const dialog = useRef(null)
  const canvas = useRef(null)
  const banner = target === 'banner'
  useEffect(() => {
    const previous = document.activeElement
    dialog.current.showModal()
    return () => { previous?.focus() }
  }, [])
  useEffect(() => {
    let active = true
    const next = new Image()
    next.src = source
    next.decode().then(() => { if (active) setImage(next) }).catch(() => { if (active) setError('No se pudo abrir la imagen. Elige otro archivo.') })
    return () => { active = false }
  }, [source])
  useEffect(() => {
    if (!image) return
    const context = canvas.current.getContext('2d')
    const { width, height } = canvas.current
    const ratio = (options.fit === 'cover' ? Math.max : Math.min)(width / image.width, height / image.height) * options.zoom
    const drawWidth = image.width * ratio
    const drawHeight = image.height * ratio
    context.fillStyle = '#111c2d'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, (width - drawWidth) * options.x / 100, (height - drawHeight) * options.y / 100, drawWidth, drawHeight)
  }, [image, options, banner])
  async function save(event) {
    event.preventDefault()
    if (!image || busy) return
    setBusy(true); setError('')
    try {
      const result = await api('/profile', { action: 'image', target, source, settings: options, image: canvas.current.toDataURL('image/jpeg', 0.85) })
      onSaved(result)
    } catch (error) { setError(error.message); setBusy(false) }
  }
  return <dialog ref={dialog} className="profile-image-editor" aria-labelledby="image-editor-title" onCancel={event => { if (busy) event.preventDefault() }} onClose={onClose}>
    <form onSubmit={save}>
      <div className="profile-section-heading"><h2 id="image-editor-title">{banner ? t('Ajustar banner') : t('Ajustar foto de perfil')}</h2><button type="button" className="profile-text-button" disabled={busy} onClick={onClose} aria-label={t("Cerrar editor")}>{t("×")}</button></div>
      <p className="profile-help">{t("Ajusta la imagen dentro del marco. La vista previa muestra cómo se guardará; puedes volver a editarla después.")}</p>
      <canvas ref={canvas} width={banner ? 1200 : 480} height={banner ? 300 : 480} className={banner ? 'profile-image-preview banner-preview' : 'profile-image-preview'} role="img" aria-label={t("Vista previa del encuadre")} />
      <fieldset disabled={busy || !image} className="profile-image-controls"><legend>{t("Encuadre de la imagen")}</legend>
        <label htmlFor="image-fit">{t("Recorte")}<select id="image-fit" value={options.fit} onChange={event => setOptions({ ...options, fit: event.target.value })}><option value="cover">{t("Recortar para llenar el marco")}</option><option value="contain">{t("Mostrar imagen completa")}</option></select></label>
        <p className="profile-help">{t("«Mostrar imagen completa» al 100 % conserva toda la foto y rellena los márgenes con un fondo oscuro.")}</p>
        <label htmlFor="image-zoom">{t("Tamaño / zoom · ")}{t(Math.round(options.zoom * 100))}{t(" %")}<input id="image-zoom" type="range" min="1" max="3" step="0.05" value={options.zoom} onChange={event => setOptions({ ...options, zoom: Number(event.target.value) })} /></label>
        <label htmlFor="image-x">{t("Centrado horizontal · ")}{t(options.x)}{t(" %")}<input id="image-x" type="range" min="0" max="100" value={options.x} onChange={event => setOptions({ ...options, x: Number(event.target.value) })} /></label>
        <label htmlFor="image-y">{t("Centrado vertical · ")}{t(options.y)}{t(" %")}<input id="image-y" type="range" min="0" max="100" value={options.y} onChange={event => setOptions({ ...options, y: Number(event.target.value) })} /></label>
        <div className="profile-editor-actions"><button type="button" className="profile-text-button" onClick={() => setOptions({ ...options, x: 50, y: 50 })}>{t("Centrar imagen")}</button><button type="button" className="profile-text-button" onClick={() => setOptions(defaults)}>{t("Restablecer ajustes")}</button></div>
      </fieldset>
      {error && <p className="auth-error" role="alert">{t(error)}</p>}
      <div className="profile-editor-actions"><button type="button" className="profile-text-button" disabled={busy} onClick={onClose}>{t("Cancelar")}</button><button className="btn-buy" disabled={busy || !image}>{busy ? t('Guardando…') : t('Guardar imagen')}</button></div>
    </form>
  </dialog>
}
