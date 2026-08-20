const geometryTypeLabelMap = {
  Point: '點位',
  LineString: '線',
  Polygon: '面',
  MultiPoint: '多點',
  MultiLineString: '多線',
  MultiPolygon: '多面',
  GeometryCollection: '幾何集合',
}

const getPointCoordinates = (geometry) => {
  const point = geometry?.type === 'Feature' ? geometry.geometry : geometry
  const coordinates = point?.type === 'Point' ? point.coordinates : null
  const longitude = Number(coordinates?.[0])
  const latitude = Number(coordinates?.[1])

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null
  }

  return { longitude, latitude }
}

const formatPointCoordinates = (geometry) => {
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
