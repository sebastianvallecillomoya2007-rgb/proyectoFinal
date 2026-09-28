export async function request(path, { method = 'GET', data, signal } = {}) {
  let response
  try {
    response = await fetch('/api' + path, {
      credentials: 'same-origin',
      ...(method === 'GET' ? {} : { method }),
      ...(signal ? { signal } : {}),
      ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar. Comprueba que el servidor esté iniciado.', { cause: error })
  }
  let result
  try { result = await response.json() } catch { throw new Error('El servidor de cuentas no está disponible.') }
  if (!response.ok) throw Object.assign(new Error(result.error || 'No se pudo completar la solicitud.'), { status: response.status })
  return result
}
export const api = (path, data) => request(path, data === undefined ? {} : { method: 'POST', data })
