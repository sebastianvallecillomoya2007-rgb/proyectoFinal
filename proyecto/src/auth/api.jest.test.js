import { afterEach, describe, expect, jest, test } from '@jest/globals'
import { api } from './api.js'

afterEach(() => jest.restoreAllMocks())

describe('Servicio HTTP del frontend', () => {
  test('recupera la sesión enviando las credenciales del mismo origen', async () => {
    const result = { user: { id: 'client-1', role: 'client' } }
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => result })
    await expect(api('/auth/me')).resolves.toEqual(result)
    expect(fetch).toHaveBeenCalledWith('/api/auth/me', { credentials: 'same-origin' })
  })

  test('envía los datos de un formulario como JSON', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ user: null }) })
    await api('/auth/logout', {})
    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
      credentials: 'same-origin', method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: '{}',
    })
  })

  test('propaga la denegación de acceso sin presentarla como un éxito', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, json: async () => ({ error: 'Se requiere una sesión de administrador.' }) })
    await expect(api('/admin/users')).rejects.toThrow('Se requiere una sesión de administrador.')
  })

  test('informa de la falta de conexión', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(api('/games')).rejects.toThrow('No se pudo conectar.')
  })

  test('detecta una respuesta HTML cuando el servidor API no está disponible', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('HTML') } })
    await expect(api('/auth/me')).rejects.toThrow('El servidor de cuentas no está disponible.')
  })
})
