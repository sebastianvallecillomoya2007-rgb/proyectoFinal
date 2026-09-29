import { t } from '../language'
import { useEffect, useRef, useState } from 'react'
import { api } from '../auth/api'
import { prepareProfileImage } from '../service/profileImage'
import { cropGeometry, defaultCrop, encodeImage, moveCrop } from '../service/profileCrop'

export default function ProfileImageEditor({ target, source, settings, onSaved, onClose }) {
  const [options, setOptions] = useState(() => ({ ...defaultCrop, ...settings }))
  const [currentSource, setCurrentSource] = useState(source)
  const [loaded, setLoaded] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [opening, setOpening] = useState(false)
  const dialog = useRef(null), canvas = useRef(null), fileInput = useRef(null), drag = useRef(null)
  const banner = target === 'banner'
  const image = loaded?.source === currentSource ? loaded.image : null
  const disabled = busy || opening || !image
  useEffect(() => {
    const previous = document.activeElement
    const element = dialog.current
    element.showModal()
    return () => { element.close(); previous?.focus() }
  }, [])
  useEffect(() => {
    let active = true
    const next = new Image()
    next.src = currentSource
    next.decode().then(() => { if (active) setLoaded({ source: currentSource, image: next }) }).catch(() => { if (active) setError('No se pudo abrir la imagen. Elige otro archivo.') })
    return () => { active = false }
  }, [currentSource])
  useEffect(() => {
    if (!image) return
    const context = canvas.current.getContext('2d')
    const { width, height } = canvas.current
    const bounds = cropGeometry(image.width, image.height, width, height, options)
    context.fillStyle = '#111c2d'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, bounds.left, bounds.top, bounds.width, bounds.height)
  }, [image, options])

  function startDrag(event) {
    if (disabled || event.button !== 0) return
    const rect = canvas.current.getBoundingClientRect()
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, options, rect, geometry: cropGeometry(image.width, image.height, canvas.current.width, canvas.current.height, options) }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus()
  }
  function moveDrag(event) {
    const start = drag.current
    if (!start || disabled || start.pointerId !== event.pointerId) return
    setOptions(moveCrop(start.options, start.geometry, (event.clientX - start.x) * canvas.current.width / start.rect.width, (event.clientY - start.y) * canvas.current.height / start.rect.height))
  }
  function moveWithKeys(event) {
    const directions = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }
    if (disabled || !directions[event.key]) return
    event.preventDefault()
    const bounds = cropGeometry(image.width, image.height, canvas.current.width, canvas.current.height, options)
    setOptions(moveCrop(options, bounds, ...directions[event.key]))
  }
  function zoomBy(amount) { setOptions(value => ({ ...value, zoom: Math.min(3, Math.max(1, Number((value.zoom + amount).toFixed(2)))) })) }
  function rotate(direction) {
    if (disabled) return
    try {
      const rotated = document.createElement('canvas')
      rotated.width = image.height; rotated.height = image.width
      const context = rotated.getContext('2d')
      context.translate(rotated.width / 2, rotated.height / 2)
      context.rotate(direction * Math.PI / 2)
      context.drawImage(image, -image.width / 2, -image.height / 2)
      setCurrentSource(encodeImage(rotated)); setOptions({ ...defaultCrop }); setError('')
    } catch (error) { setError(error.message) }
  }
  async function chooseImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return
    setOpening(true); setError('')
    try { setCurrentSource(await prepareProfileImage(file)); setOptions({ ...defaultCrop }) }
    catch (error) { setError(error.message || 'No se pudo abrir la foto.') }
    finally { setOpening(false) }
  }
  async function save(event) {
    event.preventDefault()
    if (disabled) return
    setBusy(true); setError('')
    try {
      const result = await api('/profile', { action: 'image', target, source: currentSource, settings: options, image: encodeImage(canvas.current, 400000) })
      onSaved(result)
    } catch (error) { setError(error.message); setBusy(false) }
  }
  return <dialog ref={dialog} className="profile-image-editor" aria-labelledby="image-editor-title" onCancel={event => { event.preventDefault(); if (!busy && !opening) onClose() }}>
    <form onSubmit={save}>
      <div className="profile-dialog-heading"><div><span className="profile-eyebrow">{t('DALE TU TOQUE')}</span><h2 id="image-editor-title">{banner ? t('Ajustar banner') : t('Ajustar foto de perfil')}</h2></div><button type="button" className="profile-icon-button" disabled={busy || opening} onClick={onClose} aria-label={t('Cerrar editor')}>×</button></div>
      <p className="profile-editor-description" id="image-drag-help">{banner ? t('Arrastra la imagen para elegir qué se verá en tu portada.') : t('Arrastra la foto para centrar tu rostro dentro del círculo.')}</p>
      <div className="profile-editor-stage"><div className={`profile-crop-frame${banner ? ' is-banner' : ''}`} tabIndex={disabled ? -1 : 0} role="group" aria-label={t('Mover encuadre con las flechas del teclado')} aria-describedby="image-drag-help" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }} onKeyDown={moveWithKeys}>
        <canvas ref={canvas} width={banner ? 1200 : 480} height={banner ? 300 : 480} className="profile-image-preview" role="img" aria-label={t('Vista previa del encuadre')} />
        <span className="profile-crop-guide" aria-hidden="true" />
      </div><span className="profile-drag-hint">{t('Arrastra para mover · Usa el zoom para acercar')}</span></div>
      {(!image || opening) && !error && <p className="profile-help" role="status">{t('Preparando vista previa…')}</p>}
      <fieldset disabled={disabled} className="profile-image-controls"><legend className="profile-visually-hidden">{t('Encuadre de la imagen')}</legend>
        <div className="profile-zoom-heading"><label htmlFor="image-zoom">{t('Zoom')}</label><output htmlFor="image-zoom">{Math.round(options.zoom * 100)} %</output></div>
        <div className="profile-zoom-row"><button type="button" className="profile-icon-button" aria-label={t('Alejar imagen')} disabled={disabled || options.zoom <= 1} onClick={() => zoomBy(-0.1)}>−</button><input id="image-zoom" type="range" min="1" max="3" step="0.01" value={options.zoom} onChange={event => setOptions({ ...options, zoom: Number(event.target.value) })} /><button type="button" className="profile-icon-button" aria-label={t('Acercar imagen')} disabled={disabled || options.zoom >= 3} onClick={() => zoomBy(0.1)}>+</button></div>
        <div className="profile-transform-tools"><button type="button" className="profile-secondary-button" onClick={() => rotate(-1)} aria-label={t('Girar a la izquierda')}>↶ {t('Girar')}</button><button type="button" className="profile-secondary-button" onClick={() => rotate(1)} aria-label={t('Girar a la derecha')}>↷ {t('Girar')}</button><button type="button" className="profile-secondary-button" onClick={() => setOptions({ ...options, x: 50, y: 50 })}>{t('Centrar imagen')}</button><button type="button" className="profile-text-button" onClick={() => { setCurrentSource(source); setOptions({ ...defaultCrop }); setError('') }}>{t('Restablecer ajustes')}</button></div>
        <details className="profile-precise-controls"><summary>{t('Más opciones de encuadre')}</summary><label htmlFor="image-fit">{t('Recorte')}</label><select id="image-fit" value={options.fit} onChange={event => setOptions({ ...options, fit: event.target.value })}><option value="cover">{t('Recortar para llenar el marco')}</option><option value="contain">{t('Mostrar imagen completa')}</option></select><p className="profile-help">{t('«Mostrar imagen completa» al 100 % conserva toda la foto y rellena los márgenes con un fondo oscuro.')}</p><label htmlFor="image-x">{t('Centrado horizontal')} · {Math.round(options.x)} %</label><input id="image-x" type="range" min="0" max="100" value={options.x} onChange={event => setOptions({ ...options, x: Number(event.target.value) })} /><label htmlFor="image-y">{t('Centrado vertical')} · {Math.round(options.y)} %</label><input id="image-y" type="range" min="0" max="100" value={options.y} onChange={event => setOptions({ ...options, y: Number(event.target.value) })} /></details>
      </fieldset>
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label={t('Elegir otra imagen')} hidden onChange={chooseImage} />
      {error && <p className="auth-error" role="alert">{t(error)}</p>}
      <div className="profile-editor-footer"><button type="button" className="profile-text-button" disabled={busy || opening} onClick={() => fileInput.current.click()}>{t('Elegir otra foto')}</button><div className="profile-editor-actions"><button type="button" className="profile-secondary-button" disabled={busy || opening} onClick={onClose}>{t('Cancelar')}</button><button className="btn-buy" disabled={disabled}>{busy ? t('Guardando…') : t('Guardar imagen')}</button></div></div>
    </form>
  </dialog>
}
