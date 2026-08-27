import { MVT_LAYERS, MVT_SOURCE_ID, styleLayerZoom } from '@/maps/constants'

export const businessEntityLayers = () => [
  {
    id: 'business-entity-point',
    type: 'circle',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.businessEntity.sourceLayer,
    ...styleLayerZoom(MVT_LAYERS.businessEntity),
    paint: {
      'circle-color': '#f97316',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.4, 16, 4.8, 20, 7],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 16, 0.8],
      'circle-opacity': 0.72,
    },
  },
]

export const metroStationLayers = () => [
  {
    id: 'metro-station-point',
    type: 'circle',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.metroStation.sourceLayer,
    ...styleLayerZoom(MVT_LAYERS.metroStation),
    paint: {
      'circle-color': '#0891b2',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 5.5, 18, 8],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 1.1],
      'circle-opacity': 0.82,
    },
  },
]

export const pointFeatureLayers = () => [
  ...businessEntityLayers(),
  ...metroStationLayers(),
]
