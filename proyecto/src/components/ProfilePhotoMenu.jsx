import { useEffect, useRef, useState } from 'react'
import { t } from '../language'
import '../css/profile-editor.css'

export default function ProfilePhotoMenu({ target, image, name, busy, error, onUpload, onEdit, onRemove, onClose }) {
  const dialog = useRef(null)
  const [confirming, setConfirming] = useState(false)
  const banner = target === 'banner'
  useEffect(() => {
    const previous = document.activeElement
    const element = dialog.current
    element.showModal()
    return () => { element.close(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="profile-photo-dialog" aria-labelledby="photo-menu-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="profile-dialog-heading"><div><span className="profile-eyebrow">{t('PERSONALIZA TU PERFIL')}</span><h2 id="photo-menu-title">{banner ? t('Foto de portada') : t('Foto de perfil')}</h2></div><button type="button" className="profile-icon-button" aria-label={t('Cerrar opciones de foto')} disabled={busy} onClick={onClose}>×</button></div>
    <div className={banner ? 'profile-photo-current is-banner' : 'profile-photo-current'}>{image ? <img src={image} alt={banner ? t('Banner de tu perfil') : t('Foto de perfil actual')} /> : <span aria-hidden="true">{banner ? '◇' : name.slice(0, 2).toUpperCase()}</span>}</div>
    {confirming ? <div className="profile-photo-confirm"><h3>{banner ? t('¿Eliminar la portada?') : t('¿Eliminar la foto de perfil?')}</h3><p className="profile-help">{t('Se mostrará la imagen predeterminada. Puedes subir otra foto cuando quieras.')}</p><div className="profile-editor-actions"><button className="profile-secondary-button" disabled={busy} onClick={() => setConfirming(false)}>{t('Cancelar')}</button><button className="profile-remove-button" disabled={busy} onClick={onRemove}>{busy ? t('Eliminando…') : t('Eliminar foto')}</button></div></div> : <div className="profile-photo-options">
      <button type="button" disabled={busy} onClick={onUpload}><span className="profile-option-icon" aria-hidden="true">↑</span><span><strong>{t('Subir una foto')}</strong><small>{t('Elige una imagen de tu dispositivo')}</small></span><span aria-hidden="true">›</span></button>
      {image && <><button type="button" disabled={busy} onClick={onEdit}><span className="profile-option-icon" aria-hidden="true">⌗</span><span><strong>{t('Ajustar foto actual')}</strong><small>{t('Mueve, amplía o gira tu imagen')}</small></span><span aria-hidden="true">›</span></button><button type="button" className="profile-remove-option" disabled={busy} onClick={() => setConfirming(true)}><span className="profile-option-icon" aria-hidden="true">×</span><span><strong>{t('Eliminar foto')}</strong><small>{t('Volver a la imagen predeterminada')}</small></span></button></>}
    </div>}
    {busy && <p className="profile-help" role="status">{t('Procesando imagen…')}</p>}
    {error && <p className="auth-error" role="alert">{t(error)}</p>}
    <p className="profile-photo-format">{t('PNG, JPEG o WebP · Hasta 5 MB')}</p>
  </dialog>
}
