import { MVT_LAYERS, MVT_SOURCE_ID } from '@/maps/constants'
import { compositeRankStepExpression } from '@/maps/scales/compositeRankScale'

export const metricCellHeatmapLayers = () => [
  {
    id: 'metric-cell-heatmap-fill',
    type: 'fill',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.metricCell,
    minzoom: 8,
    maxzoom: 22,
    paint: {
      'fill-color': compositeRankStepExpression(),
      'fill-opacity': 0.66,
    },
  },
  {
    id: 'metric-cell-heatmap-outline',
    type: 'line',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.metricCell,
    minzoom: 8,
    maxzoom: 22,
    paint: {
      'line-color': '#ffffff',
      'line-width': 0.32,
      'line-opacity': 0.16,
    },
  },
]
