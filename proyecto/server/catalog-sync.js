export function createCatalogSync(rawg, commerce) {
  const state = { configured: rawg.configured, nextPage: 1, error: '', syncing: false }
  let ready = false
  let task
  let retryAfter = 0
  async function page(number) {
    const result = await rawg.games(number)
    commerce.importGames(result.games)
    if (state.nextPage !== null && number >= state.nextPage) state.nextPage = result.nextPage
    state.count = result.count
    state.error = ''
  }
  return {
    state,
    page,
    async initialize() {
      if (!rawg.configured || ready || Date.now() < retryAfter) return
      if (task) return task
      state.syncing = true
      task = (async () => {
        try {
          // La primera página valida la conexión antes de solicitar más colecciones.
          await page(1)
          for (let number = 2; number <= 5 && state.nextPage; number++) await page(number)
          const collections = await Promise.allSettled(['recent', 'upcoming', 'indie'].map(kind => rawg.collection(kind)))
          for (const result of collections) {
            if (result.status === 'fulfilled') commerce.importGames(result.value)
            else state.error = 'Algunas colecciones no pudieron actualizarse. El catálogo guardado sigue disponible.'
          }
          ready = true
        } catch (error) {
          state.error = error.message
          retryAfter = Date.now() + 60000
        } finally { state.syncing = false; task = undefined }
      })()
      return task
    },
  }
}
