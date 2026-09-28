export function cosineSimilarity(a, b) {
  if (!a?.length || a.length !== b?.length) return 0
  let dot = 0, left = 0, right = 0
  for (let index = 0; index < a.length; index++) {
    dot += a[index] * b[index]
    left += a[index] ** 2
    right += b[index] ** 2
  }
  return left && right ? dot / Math.sqrt(left * right) : 0
}

export function rankEmbeddings(query, records) {
  return records.map(record => ({ id: record.id, score: cosineSimilarity(query, record.vector) }))
    .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)))
}

export function selectCandidates(games, query, limit = 120) {
  const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2)
  return games.map((game, index) => ({ game, index, hits: terms.filter(term => `${game.title} ${game.description || ''} ${(game.categories || []).join(' ')}`.toLowerCase().includes(term)).length }))
    .sort((a, b) => b.hits - a.hits || a.index - b.index).slice(0, limit).map(({ game }) => ({ id: game.id, text: `${game.title}. ${(game.categories || []).join(', ')}. ${game.description || ''}`.slice(0, 500) }))
}
