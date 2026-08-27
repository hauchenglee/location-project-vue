import * as maplibregl from 'maplibre-gl'

export const toFiniteNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const extendBoundsWithCoordinates = (bounds, coordinates) => {
  if (!Array.isArray(coordinates)) return

  if (Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1]))) {
    bounds.extend([Number(coordinates[0]), Number(coordinates[1])])
    return
  }

  coordinates.forEach((coordinate) => extendBoundsWithCoordinates(bounds, coordinate))
}

export const getGeometryBounds = (geometryLike) => {
  const geometry = geometryLike?.type === 'Feature' ? geometryLike.geometry : geometryLike
  if (!geometry) return null

  const bounds = new maplibregl.LngLatBounds()

  if (geometry.type === 'GeometryCollection') {
    geometry.geometries?.forEach((item) => extendBoundsWithCoordinates(bounds, item?.coordinates))
  } else {
    extendBoundsWithCoordinates(bounds, geometry.coordinates)
  }

  return bounds.isEmpty() ? null : bounds
}

export const getClusterBounds = (metricCluster) => {
  const minLng = toFiniteNumber(metricCluster?.minLng)
  const minLat = toFiniteNumber(metricCluster?.minLat)
  const maxLng = toFiniteNumber(metricCluster?.maxLng)
  const maxLat = toFiniteNumber(metricCluster?.maxLat)

  if ([minLng, minLat, maxLng, maxLat].some((value) => value === null)) {
    return null
  }

  const west = Math.min(minLng, maxLng)
  const south = Math.min(minLat, maxLat)
  const east = Math.max(minLng, maxLng)
  const north = Math.max(minLat, maxLat)
  const bounds = new maplibregl.LngLatBounds()

  bounds.extend([west, south])
  bounds.extend([east, north])

  return bounds.isEmpty() ? null : bounds
}

export const getClusterCenter = (metricCluster) => {
  const centerLng = toFiniteNumber(metricCluster?.centerLng)
  const centerLat = toFiniteNumber(metricCluster?.centerLat)

  if (centerLng !== null && centerLat !== null) {
    return [centerLng, centerLat]
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
    if (!clusterBounds) return

    bounds.extend(clusterBounds.getSouthWest())
    bounds.extend(clusterBounds.getNorthEast())
  })

  return bounds.isEmpty() ? null : bounds
}
