import { useSyncExternalStore } from 'react'
import { translations, patterns } from './data/translations.js'

const key = 'nexus-language'
const supported = ['es', 'en', 'ja']
function readLanguage() {
  try { const value = localStorage.getItem(key); return supported.includes(value) ? value : 'es' } catch { return 'es' }
}
let language = readLanguage()
const listeners = new Set()
function applyLanguage() {
  if (typeof document !== 'undefined') document.documentElement.lang = language
}
applyLanguage()
export function setLanguage(value) {
  if (!supported.includes(value)) return false
  language = value
  let saved = true
  try { localStorage.setItem(key, value) } catch { saved = false }
  applyLanguage()
  for (const listener of listeners) listener()
  return saved
}
function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key !== key && event.key !== null) return
  language = readLanguage()
  applyLanguage()
  for (const listener of listeners) listener()
})
export const useLanguage = () => useSyncExternalStore(subscribe, () => language, () => 'es')
export const getLocale = () => ({ es: 'es-CR', en: 'en-US', ja: 'ja-JP' })[language]

// Solo traduce texto de interfaz. Los elementos React y los datos numéricos
// pasan intactos; los nombres y textos aportados por usuarios no se procesan.
export function t(value, target = language) {
  if (typeof value !== 'string' || target === 'es') return value
  const source = value.trim()
  const index = target === 'ja' ? 1 : 0
  let translated = translations[source]?.[index]
  if (translated === undefined) {
    for (const [expression, replacements] of patterns) {
      if (expression.test(source)) { translated = source.replace(expression, replacements[index]); break }
    }
  }
  return translated === undefined ? value : value.replace(source, translated)
}
