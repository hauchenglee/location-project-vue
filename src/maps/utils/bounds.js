import * as maplibregl from 'maplibre-gl'
import { getClusterCoordinateSet } from '@/maps/models/metricCluster'

const MIN_CLUSTER_BOUNDS_SPAN = 0.002

export const getClusterBounds = (metricCluster) => {
  const coordinateSet = getClusterCoordinateSet(metricCluster)
  if (!coordinateSet?.bbox) return null

  const { west, south, east, north } = coordinateSet.bbox
  const bounds = new maplibregl.LngLatBounds()
  const lngSpan = Math.max(east - west, MIN_CLUSTER_BOUNDS_SPAN)
  const latSpan = Math.max(north - south, MIN_CLUSTER_BOUNDS_SPAN)
  const centerLng = (west + east) / 2
  const centerLat = (south + north) / 2

  bounds.extend([centerLng - lngSpan / 2, centerLat - latSpan / 2])
  bounds.extend([centerLng + lngSpan / 2, centerLat + latSpan / 2])

  return bounds.isEmpty() ? null : bounds
}

export const getClusterCenter = (metricCluster) => {
  const coordinateSet = getClusterCoordinateSet(metricCluster)

  if (coordinateSet?.center) {
    return coordinateSet.center
  }

  const bounds = getClusterBounds(metricCluster)
  if (!bounds) return null

  const center = bounds.getCenter()
  return [center.lng, center.lat]
}

export const getClustersBounds = (metricClusters) => {
  const bounds = new maplibregl.LngLatBounds()

  metricClusters.forEach((metricCluster) => {
    const clusterBounds = getClusterBounds(metricCluster)
    if (clusterBounds) {
      bounds.extend(clusterBounds.getSouthWest())
      bounds.extend(clusterBounds.getNorthEast())
      return
    }

    const center = getClusterCenter(metricCluster)
    if (!center) return

    bounds.extend(center)
  })

  return bounds.isEmpty() ? null : bounds
}
