export async function api(path, data) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    })
  } catch { throw new Error('No se pudo conectar. Comprueba que el servidor esté iniciado.') }
  let result
  try { result = await response.json() } catch { throw new Error('El servidor de cuentas no está disponible.') }
  if (!response.ok) throw new Error(result.error || 'No se pudo completar la solicitud.')
  return result
}
