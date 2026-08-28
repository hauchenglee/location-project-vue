const MAPTILER_STYLE_API_BASE_URL = 'https://api.maptiler.com/maps'

export const MAPTILER_BASEMAPS = Object.freeze({
  brightPastel: Object.freeze({
    id: 'maptiler-bright-pastel',
    provider: 'maptiler',
    styleId: 'bright-v2-pastel',
    label: 'MapTiler Bright Pastel',
  }),
  streetsPastel: Object.freeze({
    id: 'maptiler-streets-pastel',
    provider: 'maptiler',
    styleId: 'streets-v4-pastel',
    label: 'MapTiler Streets Pastel',
  }),
  datavizLight: Object.freeze({
    id: 'maptiler-dataviz-light',
    provider: 'maptiler',
    styleId: 'dataviz-v4-light',
    label: 'MapTiler Dataviz Light',
  }),
})

export const DEFAULT_MAPTILER_BASEMAP_ID = MAPTILER_BASEMAPS.brightPastel.id

export const getMapTilerApiKey = () => import.meta.env.VITE_MAPTILER_API_KEY || ''

export const getMapTilerStyleUrl = (basemap, apiKey = getMapTilerApiKey()) => {
  if (!apiKey) return null

  const params = new URLSearchParams({ key: apiKey })
  return `${MAPTILER_STYLE_API_BASE_URL}/${basemap.styleId}/style.json?${params}`
}
