const EMPTY_VALUES = new Set([null, undefined, ''])

export const toFiniteNumber = (value) => {
  if (EMPTY_VALUES.has(value)) return null

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const firstFiniteNumber = (source, keys) => {
  for (const key of keys) {
    const value = toFiniteNumber(source?.[key])
    if (value !== null) return value
  }

  return null
}

export const toClusterId = (value) => {
  if (EMPTY_VALUES.has(value)) return null

  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

export const sameClusterId = (left, right) => {
  const leftId = toClusterId(left)
  const rightId = toClusterId(right)

  return leftId !== null && rightId !== null && leftId === rightId
}

export const getClusterCoordinateSet = (metricCluster) => {
  if (!metricCluster) return null

  const centerLng = firstFiniteNumber(metricCluster, ['centerLng', 'center_lng'])
  const centerLat = firstFiniteNumber(metricCluster, ['centerLat', 'center_lat'])
  const minLng = firstFiniteNumber(metricCluster, ['minLng', 'min_lng'])
  const minLat = firstFiniteNumber(metricCluster, ['minLat', 'min_lat'])
  const maxLng = firstFiniteNumber(metricCluster, ['maxLng', 'max_lng'])
  const maxLat = firstFiniteNumber(metricCluster, ['maxLat', 'max_lat'])

  return {
    center: centerLng !== null && centerLat !== null ? [centerLng, centerLat] : null,
    bbox: [minLng, minLat, maxLng, maxLat].every((value) => value !== null)
      ? {
          west: Math.min(minLng, maxLng),
          south: Math.min(minLat, maxLat),
          east: Math.max(minLng, maxLng),
          north: Math.max(minLat, maxLat),
        }
      : null,
  }
}

