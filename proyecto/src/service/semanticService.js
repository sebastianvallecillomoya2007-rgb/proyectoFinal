import { selectCandidates } from './semanticRanking.js'

let sequence = 0
let worker
export function searchWithAI(games, query, onUpdate) {
  worker ||= new Worker(new URL('./semantic.worker.js', import.meta.url), { type: 'module' })
  const id = ++sequence
  const receive = ({ data }) => { if (data.id === id) onUpdate(data) }
  const fail = () => { onUpdate({ error: 'La IA no está disponible en este navegador. Se conserva la búsqueda normal.' }); worker?.terminate(); worker = undefined }
  const current = worker
  current.addEventListener('message', receive)
  current.addEventListener('error', fail)
  current.postMessage({ id, query, games: selectCandidates(games, query) })
  return () => {
    current.removeEventListener('message', receive)
    current.removeEventListener('error', fail)
    current.postMessage({ id: ++sequence, cancel: true })
  }
}
