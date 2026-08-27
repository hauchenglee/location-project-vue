export const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return `${baseUrl}${path}`
}

export const getMapTileUrl = ({ analysisId, metricClusterId } = {}) => {
  const params = new URLSearchParams()
  if (analysisId) params.set('analysisId', analysisId)
  if (metricClusterId) params.set('metricClusterId', metricClusterId)

  const query = params.toString()
  return getApiUrl(`/api/map/tiles/{z}/{x}/{y}.mvt${query ? `?${query}` : ''}`)
}
