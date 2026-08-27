import { MVT_LAYERS, MVT_SOURCE_ID } from '@/maps/constants'
import { compositeRankStepExpression } from '@/maps/scales/compositeRankScale'

const metricClusterFilterExpression = (metricClusterId) => [
  '==',
  ['to-string', ['get', 'metric_cluster_id']],
  String(metricClusterId || ''),
]

export const metricCellHeatmapLayers = ({ metricClusterId }) => [
  {
    id: 'metric-cell-heatmap-fill',
    type: 'fill',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.metricCell,
    minzoom: 8,
    maxzoom: 23,
    filter: metricClusterFilterExpression(metricClusterId),
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
    maxzoom: 23,
    filter: metricClusterFilterExpression(metricClusterId),
    paint: {
      'line-color': '#ffffff',
      'line-width': 0.32,
      'line-opacity': 0.16,
    },
  },
]
