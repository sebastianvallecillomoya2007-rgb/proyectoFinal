import { useEffect, useState } from 'react'
import { request } from './api'

export default function useFreeCatalog({ enabled, category, platform, order, revision }) {
  const [result, setResult] = useState(null)
  const params = new URLSearchParams({ platform, 'sort-by': order === 'title' ? 'alphabetical' : ['release-date', 'relevance', 'popularity'].includes(order) ? order : 'relevance' })
  if (category !== 'all') params.set('category', category)
  const query = params.toString()
  const key = `${query}:${revision}`
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    request('/freetogame/games?' + query, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ key, ...data })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, games: [], notice: error.message })
    })
    return () => controller.abort()
  }, [enabled, query, key])
  return { games: result?.key === key ? result.games : [], categories: result?.categories || [], notice: result?.key === key ? result.notice : '', loading: enabled && result?.key !== key }
}
