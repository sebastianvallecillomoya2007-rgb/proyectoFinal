import { afterEach, describe, expect, test } from '@jest/globals'
import { getLocale, setLanguage, t } from './language.js'
import { translations } from './data/translations.js'

afterEach(() => setLanguage('es'))
describe('Idiomas de la interfaz', () => {
  test('español, inglés y japonés cambian las etiquetas y el formato regional', () => {
    expect(t('Tienda')).toBe('Tienda')
    setLanguage('en')
    expect(t('Tienda')).toBe('Store')
    expect(getLocale()).toBe('en-US')
    setLanguage('ja')
    expect(t('Tienda')).toBe('ストア')
    expect(getLocale()).toBe('ja-JP')
    setLanguage('invalid')
    expect(getLocale()).toBe('ja-JP')
  })
  test('conserva valores dinámicos, espacios y contenido que no es una etiqueta', () => {
    expect(t(' Comprar Elden Ring ', 'ja')).toBe(' Elden Ring を購入 ')
    expect(t('Una reseña escrita por el usuario', 'en')).toBe('Una reseña escrita por el usuario')
    expect(t(42, 'ja')).toBe(42)
    const element = { type: 'button' }
    expect(t(element, 'en')).toBe(element)
    expect(t('IA: analizando 5 de 10 juegos…', 'en')).toBe('AI: analyzing 5 of 10 games…')
  })
  test('todas las entradas tienen traducción en los dos idiomas adicionales', () => {
    for (const [source, pair] of Object.entries(translations)) {
      expect(pair).toHaveLength(2)
      expect(pair.every(value => typeof value === 'string' && value.length > 0)).toBe(true)
      expect(t(source, 'en')).toBe(pair[0])
      expect(t(source, 'ja')).toBe(pair[1])
    }
  })
})
