// El adaptador del servidor evita depender del CORS del proveedor externo.
export function fetchExternalGames(url, options = {}) {
  return fetch(url, options)
}
