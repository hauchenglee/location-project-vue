import { MVT_LAYERS, MVT_SOURCE_ID, styleLayerZoom } from '@/maps/constants'
import { compositeRankStepExpression } from '@/maps/scales/compositeRankScale'

export const metricCellHeatmapLayers = () => [
  {
    id: 'metric-cell-heatmap-fill',
    type: 'fill',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.metricCell.sourceLayer,
    ...styleLayerZoom(MVT_LAYERS.metricCell),
    paint: {
      'fill-color': compositeRankStepExpression(MVT_LAYERS.metricCell.properties.compositeRank),
      'fill-opacity': 0.66,
    },
  },
  {
    id: 'metric-cell-heatmap-outline',
    type: 'line',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.metricCell.sourceLayer,
    ...styleLayerZoom(MVT_LAYERS.metricCell),
    paint: {
      'line-color': '#ffffff',
      'line-width': 0.32,
      'line-opacity': 0.16,
    },
  },
]
