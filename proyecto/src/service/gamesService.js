import { api } from '../auth/api'

// El servidor adapta OpenGames y conserva precios, cuentas y datos de comunidad.
export const getGames = () => api('/games')
export const getGameById = id => api('/games/' + encodeURIComponent(id))

export async function getCatalogFromUrl(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('No se pudo cargar el catálogo: HTTP ' + response.status)
  return response.json()
}
