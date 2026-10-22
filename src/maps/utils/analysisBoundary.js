// This geometry is decoded locally from the complete boundary MVT, never from
// visible map tiles: tile clipping and missing tiles must not become drag walls.
const EPSILON = 1e-10
const interpolate = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]]

const nearestOnSegment = (point, a, b) => {
  const delta = subtract(b, a)
  const lengthSquared = delta[0] ** 2 + delta[1] ** 2
  const t = lengthSquared ? Math.max(0, Math.min(1,
    ((point[0] - a[0]) * delta[0] + (point[1] - a[1]) * delta[1]) / lengthSquared,
  )) : 0
  const coordinate = interpolate(a, b, t)
  return { coordinate, t, distance: Math.hypot(point[0] - coordinate[0], point[1] - coordinate[1]) }
}

const ringContains = (point, ring) => {
  let inside = false
  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i]
    const b = ring[i + 1]
    if (nearestOnSegment(point, a, b).distance <= EPSILON) return 'boundary'
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) {
      inside = !inside
    }
  }
  return inside
}

export const createAnalysisBoundary = (geometry) => {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates : []
  if (!polygons.length) throw new Error('缺少可用的分析範圍邊界')

  const edges = polygons.flatMap((polygon) => polygon.flatMap((ring) => {
    const ringEdges = []
    ring.slice(0, -1).forEach((a, index) => ringEdges.push({ a, b: ring[index + 1], ring, ringEdges, index }))
    return ringEdges
  }))
  let project = ([x, y]) => ({ x, y })
  const screenPoint = (point) => {
    const { x, y } = project(point)
    return [x, y]
  }

  // The camera is stationary during a marker gesture. Project vertices once per
  // gesture, so each pointer move measures visual distance without map calls for
  // every coastline segment (including when the map is rotated or pitched).
  const setProjection = (projection) => {
    project = projection
    edges.forEach((edge) => {
      edge.screenA = screenPoint(edge.a)
      edge.screenB = screenPoint(edge.b)
    })
  }
  setProjection(project)

  const covers = (point) => polygons.some((polygon) => {
    const outer = ringContains(point, polygon[0])
    if (outer === 'boundary') return true
    if (!outer) return false
    for (const hole of polygon.slice(1)) {
      const location = ringContains(point, hole)
      if (location === 'boundary') return true
      if (location) return false
    }
    return true
  })

  const nearest = (point, previousEdge = null) => {
    const position = screenPoint(point)
    const candidateOn = (edge) => {
      const hit = nearestOnSegment(position, edge.screenA, edge.screenB)
      return { coordinate: interpolate(edge.a, edge.b, hit.t), distance: hit.distance, edge }
    }
    let result = null
    for (const edge of edges) {
      const candidate = candidateOn(edge)
      if (!result || candidate.distance < result.distance) result = candidate
    }

    if (!previousEdge) return result
    const previous = candidateOn(previousEdge)
    if (previous.distance <= result.distance + 0.75) return previous
    const { ringEdges, index } = previousEdge
    let continuous = null
    for (let offset = -1; offset <= 1; offset += 1) {
      const edge = ringEdges[(index + offset + ringEdges.length) % ringEdges.length]
      const candidate = candidateOn(edge)
      if (!continuous || candidate.distance < continuous.distance) continuous = candidate
    }
    // Only break near-ties, within 0.75 CSS px. A new clearly closer stretch
    // always wins, so continuity cannot pin the marker to an old collision.
    if (continuous.distance <= result.distance + 0.75) return continuous
    return result
  }

  const constrain = (target, previousEdge = null) => {
    if (covers(target)) return { coordinate: target, blocked: false }
    const hit = nearest(target, previousEdge)
    return { coordinate: hit.coordinate, blocked: true, edge: hit.edge }
  }

  return { covers, constrain, nearest, setProjection }
}

// Highlight a short stretch on either side of the collision, at any map zoom.
export const boundaryContactLine = (edge, coordinate, project) => {
  const { ring, index } = edge
  const count = ring.length - 1
  const trace = (step) => {
    const points = []
    let previous = coordinate
    let remaining = 70
    for (let offset = 0; offset < count && remaining > 0; offset += 1) {
      const nextIndex = (index + (step > 0 ? 1 : 0) + step * offset + count) % count
      const next = ring[nextIndex]
      const a = project(previous)
      const b = project(next)
      const distance = Math.hypot(b.x - a.x, b.y - a.y)
      points.push(distance > remaining ? interpolate(previous, next, remaining / distance) : next)
      remaining -= distance
      previous = next
    }
    return points
  }
  return {
    type: 'Feature', properties: {},
    geometry: { type: 'LineString', coordinates: [...trace(-1).reverse(), coordinate, ...trace(1)] },
  }
}
