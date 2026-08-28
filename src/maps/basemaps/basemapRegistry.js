import { DEFAULT_MAPTILER_BASEMAP_ID, MAPTILER_BASEMAPS, getMapTilerStyleUrl } from '@/maps/basemaps/mapTilerBasemaps'

export const BASEMAPS = Object.freeze({
  [MAPTILER_BASEMAPS.brightPastel.id]: MAPTILER_BASEMAPS.brightPastel,
  [MAPTILER_BASEMAPS.streetsPastel.id]: MAPTILER_BASEMAPS.streetsPastel,
  [MAPTILER_BASEMAPS.datavizLight.id]: MAPTILER_BASEMAPS.datavizLight,
})

export const DEFAULT_BASEMAP_ID = DEFAULT_MAPTILER_BASEMAP_ID

export const getActiveBasemap = () => {
  const configuredBasemapId = import.meta.env.VITE_MAP_BASEMAP_ID || DEFAULT_BASEMAP_ID
  return BASEMAPS[configuredBasemapId] || BASEMAPS[DEFAULT_BASEMAP_ID]
}

export const getBasemapStyleUrl = (basemap = getActiveBasemap()) => {
  if (basemap.provider === 'maptiler') {
    return getMapTilerStyleUrl(basemap)
  }

  return null
}
