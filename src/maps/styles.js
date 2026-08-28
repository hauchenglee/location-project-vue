import { MVT_LAYERS, MVT_SOURCE_ID } from '@/maps/constants'
import { loadBasemapStyle } from '@/maps/basemaps/basemapStyleLoader'
import { adminBoundaryLayers } from '@/maps/layers/baseMapLayers'
import { clusterFootprintLayers } from '@/maps/layers/clusterFootprintLayers'
import { metricCellHeatmapLayers } from '@/maps/layers/metricCellHeatmapLayers'
import { pointFeatureLayers } from '@/maps/layers/pointFeatureLayers'
import { getMapTileUrl } from '@/maps/utils/tileUrl'

const mvtSource = ({ analysisId, metricClusterId } = {}) => ({
  type: 'vector',
  tiles: [getMapTileUrl({ analysisId, metricClusterId })],
  minzoom: MVT_LAYERS.adminCounty.minzoom,
  maxzoom: MVT_LAYERS.metricCluster.maxzoom,
})

const composeMapStyle = async ({ source, layers }) => {
  const style = await loadBasemapStyle()

  return {
    ...style,
    sources: {
      ...(style.sources || {}),
      [MVT_SOURCE_ID]: source,
    },
    layers: [
      ...(style.layers || []),
      ...layers,
    ],
  }
}

export const createClusterLocatorStyle = ({ analysisId, metricClusters, selectedMetricClusterId, hoveredMetricClusterId }) =>
  composeMapStyle({
    source: mvtSource({ analysisId }),
    layers: [
      ...adminBoundaryLayers(),
      ...clusterFootprintLayers({ metricClusters, selectedMetricClusterId, hoveredMetricClusterId }),
    ],
  })

export const createClusterHeatmapStyle = ({ analysisId, metricClusterId }) =>
  composeMapStyle({
    source: mvtSource({ analysisId, metricClusterId }),
    layers: [
      ...adminBoundaryLayers(),
      ...metricCellHeatmapLayers(),
      ...pointFeatureLayers(),
    ],
  })
