import test from 'node:test'
import assert from 'node:assert/strict'
import { createAnalysisBoundary, boundaryContactLine } from '../src/maps/utils/analysisBoundary.js'

const square = (left, bottom, right, top) => [[left, bottom], [right, bottom], [right, top], [left, top], [left, bottom]]
const polygon = (...rings) => createAnalysisBoundary({ type: 'Polygon', coordinates: rings })

// Geometry here is already the server's inset drag area; its own boundary is
// allowed, while the original supported-area boundary stays at least 1 m away.
test('stops on the inset limit and slides with the latest pointer along it', () => {
  const boundary = polygon(square(1, 1, 9, 9))
  const hit = boundary.constrain([15, 5])
  assert.equal(hit.blocked, true)
  assert.deepEqual(hit.coordinate, [9, 5])
  const slide = boundary.constrain([15, 8], hit.edge)
  assert.deepEqual(slide.coordinate, [9, 8])
  assert.deepEqual(boundary.constrain([2, 7], slide.edge), { coordinate: [2, 7], blocked: false })
  assert.equal(boundary.covers([9.000001, 5]), false)
})

test('allows crossing adjacent supported municipalities', () => {
  const boundary = createAnalysisBoundary({
    type: 'MultiPolygon', coordinates: [[square(0, 0, 5, 10)], [square(5, 0, 10, 10)]],
  })
  assert.deepEqual(boundary.constrain([8, 5]), { coordinate: [8, 5], blocked: false })
})

test('immediately follows a valid target across a bay or hole instead of staying at the old collision', () => {
  const boundary = polygon(square(0, 0, 10, 10), square(4, 4, 6, 6))
  const hit = boundary.constrain([4.2, 5])
  assert.deepEqual(hit.coordinate, [4, 5])
  assert.deepEqual(boundary.constrain([8, 5], hit.edge), { coordinate: [8, 5], blocked: false })
  const bay = polygon([[0, 0], [10, 0], [10, 10], [6, 10], [6, 4], [4, 4], [4, 10], [0, 10], [0, 0]])
  assert.deepEqual(bay.constrain([8, 8]), { coordinate: [8, 8], blocked: false })
})

test('keeps every displayed position legal when the pointer moves between islands', () => {
  const boundary = createAnalysisBoundary({
    type: 'MultiPolygon', coordinates: [[square(0, 0, 4, 10)], [square(6, 0, 10, 10)]],
  })
  assert.equal(boundary.constrain([5, 5]).blocked, true)
  assert.deepEqual(boundary.constrain([8, 5]), { coordinate: [8, 5], blocked: false })
})

test('chooses the visually nearest edge using the current map projection', () => {
  const boundary = polygon(square(0, 0, 10, 10), square(4, 4, 6, 6))
  assert.deepEqual(boundary.constrain([4.2, 4.8]).coordinate, [4, 4.8])
  boundary.setProjection(([x, y]) => ({ x: x * 10, y }))
  assert.deepEqual(boundary.constrain([4.2, 4.8]).coordinate, [4.2, 4])
})

test('stabilizes near-ties but releases the old edge when a new stretch is clearly closer', () => {
  const boundary = polygon(square(0, 0, 10, 10), square(4, 4, 6, 6))
  boundary.setProjection(([x, y]) => ({ x: x * 100, y: y * 100 }))
  const bottom = boundary.constrain([5, 4.9])
  assert.deepEqual(bottom.coordinate, [5, 4])
  assert.deepEqual(boundary.constrain([5, 5.001], bottom.edge).coordinate, [5, 4])
  assert.deepEqual(boundary.constrain([5, 5.1], bottom.edge).coordinate, [5, 6])
})

test('highlight stays on the original outline rather than the inset drag limit', () => {
  const dragArea = polygon(square(1, 1, 9, 9))
  const outline = polygon(square(0, 0, 10, 10))
  const dragHit = dragArea.constrain([15, 5])
  const contact = outline.nearest(dragHit.coordinate)
  const line = boundaryContactLine(contact.edge, contact.coordinate, ([x, y]) => ({ x: x * 100, y: y * 100 }))
  assert.deepEqual(dragHit.coordinate, [9, 5])
  assert.deepEqual(line.geometry.coordinates, [[10, 4.3], [10, 5], [10, 5.7]])
})
