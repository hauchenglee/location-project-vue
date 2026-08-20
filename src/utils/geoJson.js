const geometryTypeLabelMap = {
  Point: '點位',
  LineString: '線',
  Polygon: '面',
  MultiPoint: '多點',
  MultiLineString: '多線',
  MultiPolygon: '多面',
  GeometryCollection: '幾何集合',
}

export const defaultPointGeometry = {
  type: 'Point',
  coordinates: [121.5654, 25.033],
}

export const parseGeometryText = (value) => {
  if (!value || !String(value).trim()) return null

  const parsed = JSON.parse(value)
  return parsed?.type === 'Feature' ? parsed.geometry : parsed
}

export const stringifyGeometry = (geometry) => {
  if (!geometry) return ''
  return JSON.stringify(geometry, null, 2)
}

export const createPointGeometry = (longitude, latitude) => ({
  type: 'Point',
  coordinates: [Number(longitude), Number(latitude)],
})

export const getPointCoordinates = (geometry) => {
  const point = geometry?.type === 'Feature' ? geometry.geometry : geometry
  const coordinates = point?.type === 'Point' ? point.coordinates : null
  const longitude = Number(coordinates?.[0])
  const latitude = Number(coordinates?.[1])

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null
  }

  return { longitude, latitude }
}

export const formatPointCoordinates = (geometry) => {
  const coordinates = getPointCoordinates(geometry)

  if (!coordinates) return '-'

  return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
}

export const formatGeometrySummary = (geometry) => {
  if (!geometry) return '-'

  const type = geometryTypeLabelMap[geometry.type] || geometry.type || 'Geometry'
  const pointCoordinates = formatPointCoordinates(geometry)

  return pointCoordinates === '-' ? type : `${type} ${pointCoordinates}`
}
