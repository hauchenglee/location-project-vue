import { MVT_LAYERS, MVT_SOURCE_ID, styleLayerZoom } from '@/maps/constants'

export const backgroundLayer = () => ({
  id: 'background',
  type: 'background',
  paint: {
    'background-color': '#eef3f8',
  },
})

export const adminBoundaryLayers = () => [
  {
    id: 'admin-county-fill',
    type: 'fill',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.adminCounty.sourceLayer,
    ...styleLayerZoom(MVT_LAYERS.adminCounty),
    paint: {
      'fill-color': '#e8edf3',
      'fill-opacity': 0.72,
    },
  },
  {
    id: 'admin-county-outline',
    type: 'line',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.adminCounty.sourceLayer,
    ...styleLayerZoom(MVT_LAYERS.adminCounty),
    paint: {
      'line-color': '#9aa8b8',
      'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.6, 11, 1.2],
    },
  },
  {
    id: 'admin-town-outline',
    type: 'line',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.adminTown.sourceLayer,
    ...styleLayerZoom(MVT_LAYERS.adminTown),
    paint: {
      'line-color': '#c0cad6',
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.3, 13, 0.9],
    },
  },
]
