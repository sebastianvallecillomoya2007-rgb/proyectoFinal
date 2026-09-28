import { useEffect, useRef, useState } from 'react'
import { setLanguage, useLanguage, t } from '../language'

const defaults = { theme: 'dark', textSize: '100', contrast: false, reading: false, motion: false, targets: false, links: false }
const storageKey = 'nexus-settings'
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey)) || {}
    return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key,
      key === 'theme' ? (['dark', 'light'].includes(saved[key]) ? saved[key] : value)
        : key === 'textSize' ? (['100', '125', '150', '200'].includes(saved[key]) ? saved[key] : value)
          : typeof saved[key] === 'boolean' ? saved[key] : value]))
  } catch { return defaults }
}

export default function Settings() {
  const language = useLanguage()
  const [settings, setSettings] = useState(loadSettings)
  const [storageError, setStorageError] = useState(false)
  const dialog = useRef(null)
  const trigger = useRef(null)
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.style.fontSize = `${settings.textSize}%`
    for (const key of ['contrast', 'reading', 'motion', 'targets', 'links']) root.dataset[key] = String(settings[key])
    window.dispatchEvent(new Event('nexus-settings-change'))
  }, [settings])
  function update(next) {
    setSettings(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setStorageError(false) }
    catch { setStorageError(true) }
  }
  function keepFocus(event) {
    if (event.key !== 'Tab') return
    const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')]
    const first = controls[0]
    const last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  const toggles = [
    ['contrast', 'Alto contraste', 'Aumenta la diferencia entre texto, controles y fondos.'],
    ['reading', 'Lectura cómoda', 'Amplía el interlineado y la separación de letras.'],
    ['motion', 'Reducir movimiento', 'Desactiva animaciones y el avance automático del carrusel.'],
    ['targets', 'Controles grandes', 'Amplía las zonas de pulsación para facilitar el uso del ratón o la pantalla táctil.'],
    ['links', 'Destacar enlaces', 'Subraya los enlaces para identificarlos sin depender del color.'],
  ]
  return <>
    <button ref={trigger} className="settings-trigger" onClick={() => dialog.current.showModal()} aria-haspopup="dialog" aria-controls="page-settings">{t("⚙ Ajustes")}</button>
    <dialog ref={dialog} id="page-settings" className="settings-dialog" aria-labelledby="settings-title" onKeyDown={keepFocus} onClose={() => trigger.current?.focus()}>
      <div className="settings-heading"><h2 id="settings-title">{t("Ajustes de la página")}</h2><button type="button" onClick={() => dialog.current.close()} aria-label={t("Cerrar ajustes")}>{t("×")}</button></div>
      <p>{t("Personaliza la apariencia y la accesibilidad. Los cambios se aplican al instante y se guardan en este navegador.")}</p>
      <p className="settings-keyboard-help">{t("Usa Tab y Mayús + Tab para recorrer los controles, Enter o Espacio para activarlos y Escape para cerrar los ajustes. El enlace «Saltar al contenido» aparece al navegar con el teclado.")}</p>
      <div className="settings-fields">
        <label htmlFor="setting-language">{t("Idioma")}<select id="setting-language" value={language} onChange={event => setStorageError(!setLanguage(event.target.value))}><option value="es" lang="es">{t("Español")}</option><option value="en" lang="en">{t("English")}</option><option value="ja" lang="ja">{t("日本語")}</option></select></label>
        <label htmlFor="setting-theme">{t("Apariencia")}<select id="setting-theme" value={settings.theme} onChange={event => update({ ...settings, theme: event.target.value })}><option value="dark">{t("Modo oscuro")}</option><option value="light">{t("Modo claro")}</option></select></label>
        <label htmlFor="setting-size">{t("Tamaño del texto")}<select id="setting-size" value={settings.textSize} onChange={event => update({ ...settings, textSize: event.target.value })}><option value="100">{t("Normal · 100 %")}</option><option value="125">{t("Grande · 125 %")}</option><option value="150">{t("Muy grande · 150 %")}</option><option value="200">{t("Máximo · 200 %")}</option></select></label>
        <fieldset><legend>{t("Accesibilidad")}</legend>{toggles.map(([key, label, description]) => <label className="settings-toggle" key={key}><input type="checkbox" aria-describedby={`setting-${key}-help`} checked={settings[key]} onChange={event => update({ ...settings, [key]: event.target.checked })} /><span><strong>{t(label)}</strong><small id={`setting-${key}-help`}>{t(description)}</small></span></label>)}</fieldset>
      </div>
      {storageError && <p role="status">{t("Los ajustes se aplicaron, pero este navegador no permite guardarlos para la próxima visita.")}</p>}
      <div className="settings-actions"><button className="btn-redeem" onClick={() => { update(defaults); if (!setLanguage('es')) setStorageError(true) }}>{t("Restablecer ajustes")}</button><button className="btn-buy" onClick={() => dialog.current.close()}>{t("Listo")}</button></div>
    </dialog>
  </>
}
