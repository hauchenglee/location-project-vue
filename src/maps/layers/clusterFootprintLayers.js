import { CLUSTER_LOCATOR_COLORS, MVT_LAYERS, MVT_SOURCE_ID } from '@/maps/constants'

export const clusterFootprintColorExpression = (metricClusters) => {
  if (!metricClusters.length) return '#2563eb'

  const expression = ['match', ['to-string', ['get', 'id']]]

  metricClusters.forEach((metricCluster, index) => {
    expression.push(String(metricCluster.id), CLUSTER_LOCATOR_COLORS[index % CLUSTER_LOCATOR_COLORS.length])
  })

  expression.push('#2563eb')
  return expression
}

export const clusterFootprintLayers = ({ metricClusters, selectedMetricClusterId, hoveredMetricClusterId }) => {
  const selected = ['==', ['to-string', ['get', 'id']], String(selectedMetricClusterId || '')]
  const hovered = ['==', ['to-string', ['get', 'id']], String(hoveredMetricClusterId || '')]

  return [
    {
      id: 'cluster-footprint-fill',
      type: 'fill',
      source: MVT_SOURCE_ID,
      'source-layer': MVT_LAYERS.metricCluster,
      minzoom: 8,
      maxzoom: 23,
      paint: {
        'fill-color': [
          'case',
          selected,
          '#111827',
          hovered,
          '#1f2937',
          clusterFootprintColorExpression(metricClusters),
        ],
        'fill-opacity': ['case', selected, 0.42, hovered, 0.36, 0.28],
      },
    },
    {
      id: 'cluster-footprint-outline',
      type: 'line',
      source: MVT_SOURCE_ID,
      'source-layer': MVT_LAYERS.metricCluster,
      minzoom: 8,
      maxzoom: 23,
      paint: {
        'line-color': ['case', selected, '#111827', hovered, '#1f2937', '#ffffff'],
        'line-width': ['case', selected, 1.8, hovered, 1.4, 0.8],
        'line-opacity': ['case', selected, 0.8, hovered, 0.72, 0.52],
      },
    },
  ]
}
