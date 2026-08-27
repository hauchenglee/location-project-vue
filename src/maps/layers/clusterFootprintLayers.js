import { CLUSTER_LOCATOR_COLORS, MVT_LAYERS, MVT_SOURCE_ID, styleLayerZoom } from '@/maps/constants'

const toMvtInt = (value) => {
  if (value === null || value === undefined || value === '') return null

  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

const clusterIdProperty = MVT_LAYERS.metricCluster.properties.id

const clusterIdEqualsExpression = (metricClusterId) => {
  const mvtClusterId = toMvtInt(metricClusterId)
  return mvtClusterId === null ? false : ['==', ['get', clusterIdProperty], mvtClusterId]
}

export const clusterFootprintColorExpression = (metricClusters) => {
  if (!metricClusters.length) return '#2563eb'

  const expression = ['match', ['get', clusterIdProperty]]
  const usedClusterIds = new Set()

  metricClusters.forEach((metricCluster, index) => {
    const mvtClusterId = toMvtInt(metricCluster.id)
    if (mvtClusterId === null || usedClusterIds.has(mvtClusterId)) return

    usedClusterIds.add(mvtClusterId)
    expression.push(mvtClusterId, CLUSTER_LOCATOR_COLORS[index % CLUSTER_LOCATOR_COLORS.length])
  })

  if (!usedClusterIds.size) return '#2563eb'

  expression.push('#2563eb')
  return expression
}

export const clusterFootprintLayers = ({ metricClusters, selectedMetricClusterId, hoveredMetricClusterId }) => {
  const selected = clusterIdEqualsExpression(selectedMetricClusterId)
  const hovered = clusterIdEqualsExpression(hoveredMetricClusterId)

  return [
    {
      id: 'cluster-footprint-fill',
      type: 'fill',
      source: MVT_SOURCE_ID,
      'source-layer': MVT_LAYERS.metricCluster.sourceLayer,
      ...styleLayerZoom(MVT_LAYERS.metricCluster),
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
      'source-layer': MVT_LAYERS.metricCluster.sourceLayer,
      ...styleLayerZoom(MVT_LAYERS.metricCluster),
      paint: {
        'line-color': ['case', selected, '#111827', hovered, '#1f2937', '#ffffff'],
        'line-width': ['case', selected, 1.8, hovered, 1.4, 0.8],
        'line-opacity': ['case', selected, 0.8, hovered, 0.72, 0.52],
      },
    },
  ]
}
