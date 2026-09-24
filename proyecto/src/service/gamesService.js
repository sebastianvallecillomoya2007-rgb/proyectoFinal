import { api } from '../auth/api'

// El servidor adapta OpenGames y conserva precios, cuentas y datos de comunidad.
export const getGames = () => api('/games')
export const getGameById = id => api('/games/' + encodeURIComponent(id))
