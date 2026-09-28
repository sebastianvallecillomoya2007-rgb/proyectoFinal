import { env, pipeline } from '@huggingface/transformers'
import { rankEmbeddings } from './semanticRanking.js'

env.allowLocalModels = false
env.backends.onnx.wasm.numThreads = 1
let extractor
let latest = 0
let running = false
let pending
const cache = new Map()

async function run() {
  if (running) return
  running = true
  while (pending) {
    const { id, query, games } = pending
    pending = null
    try {
      self.postMessage({ id, status: 'Preparando IA; la primera descarga del modelo puede tardar varios minutos…' })
      extractor ||= pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', { dtype: 'q8', device: 'wasm' })
      const model = await extractor
      if (id !== latest) continue
      const queryVector = (await model(query, { pooling: 'mean', normalize: true })).data
      const records = []
      for (const game of games) {
        if (id !== latest) break
        let vector = cache.get(game.text)
        if (!vector) {
          vector = Array.from((await model(game.text, { pooling: 'mean', normalize: true })).data)
          if (cache.size >= 400) cache.delete(cache.keys().next().value)
          cache.set(game.text, vector)
        }
        records.push({ id: game.id, vector })
        if (records.length % 5 === 0) self.postMessage({ id, status: `IA: analizando ${records.length} de ${games.length} juegos…` })
      }
      if (id === latest) self.postMessage({ id, results: rankEmbeddings(queryVector, records), status: `IA: ${records.length} juegos ordenados por afinidad. Puedes cambiar a Nombre A–Z para volver a la búsqueda normal.` })
    } catch {
      extractor = undefined
      if (id === latest) self.postMessage({ id, error: 'No se pudo cargar la IA. Comprueba la conexión y vuelve a seleccionar Afinidad con tu búsqueda (IA). Se conserva la búsqueda normal.' })
    }
  }
  running = false
}
self.onmessage = ({ data }) => {
  latest = data.id
  pending = data.cancel ? null : data
  void run()
}
