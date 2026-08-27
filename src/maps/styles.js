import { MVT_SOURCE_ID } from '@/maps/constants'
import { backgroundLayer, adminBoundaryLayers } from '@/maps/layers/baseMapLayers'
import { clusterFootprintLayers } from '@/maps/layers/clusterFootprintLayers'
import { metricCellHeatmapLayers } from '@/maps/layers/metricCellHeatmapLayers'
import { getMapTileUrl } from '@/maps/utils/tileUrl'

const mvtSource = ({ analysisId, metricClusterId } = {}) => ({
  type: 'vector',
  tiles: [getMapTileUrl({ analysisId, metricClusterId })],
  minzoom: 0,
  maxzoom: 22,
})

export const createClusterLocatorStyle = ({ analysisId, metricClusters, selectedMetricClusterId, hoveredMetricClusterId }) => ({
  version: 8,
  sources: {
    [MVT_SOURCE_ID]: mvtSource({ analysisId }),
  },
  layers: [
    backgroundLayer(),
    ...adminBoundaryLayers(),
    ...clusterFootprintLayers({ metricClusters, selectedMetricClusterId, hoveredMetricClusterId }),
  ],
})

export const createClusterHeatmapStyle = ({ analysisId, metricClusterId }) => ({
  version: 8,
  sources: {
    [MVT_SOURCE_ID]: mvtSource({ analysisId, metricClusterId }),
  },
  layers: [
    backgroundLayer(),
    ...adminBoundaryLayers(),
    ...metricCellHeatmapLayers({ metricClusterId }),
  ],
})
