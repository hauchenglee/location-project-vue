export const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return `${baseUrl}${path}`
}

const DEFAULT_MVT_BBOX_TILE_TEMPLATE = '/api/map/tiles.mvt?bbox={bbox-epsg-3857}&z={z}'

const appendQueryParams = (url, params) => {
  const query = params.toString()
  if (!query) return url

  return `${url}${url.includes('?') ? '&' : '?'}${query}`
}

export const getMapTileUrl = ({ analysisId, metricClusterId } = {}) => {
  const tileTemplate = import.meta.env.VITE_MVT_TILE_TEMPLATE || DEFAULT_MVT_BBOX_TILE_TEMPLATE
  const params = new URLSearchParams()

  if (analysisId !== null && analysisId !== undefined && analysisId !== '') {
    params.set('analysisId', analysisId)
  }
  if (metricClusterId !== null && metricClusterId !== undefined && metricClusterId !== '') {
    params.set('metricClusterId', metricClusterId)
  }

  return getApiUrl(appendQueryParams(tileTemplate, params))
}
