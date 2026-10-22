import test from 'node:test'
import assert from 'node:assert/strict'
import { installLongPressDrag } from '../src/maps/utils/longPressDrag.js'

class FakeElement extends EventTarget {
  constructor() {
    super()
    this.ownerDocument = Object.assign(new EventTarget(), { defaultView: new EventTarget(), hidden: false })
    this.classes = new Set()
    this.classList = {
      add: (...names) => names.forEach((name) => this.classes.add(name)),
      remove: (...names) => names.forEach((name) => this.classes.delete(name)),
      replace: (before, after) => { this.classes.delete(before); this.classes.add(after) },
    }
  }
  setPointerCapture(id) { this.captured = id }
  hasPointerCapture(id) { return this.captured === id }
  releasePointerCapture() { this.captured = null }
}

const pointer = (element, type, options = {}) => element.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), {
  isPrimary: true, button: 0, pointerId: 1, pointerType: 'mouse', clientX: 10, clientY: 10, ...options,
}))

const setup = (context, canStart = () => true) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const element = new FakeElement()
  const calls = []
  const drag = installLongPressDrag({
    element, canStart,
    onStart: () => calls.push('start'), onMove: () => calls.push('move'),
    onEnd: () => calls.push('end'), onCancel: () => calls.push('cancel'), onRelease: () => calls.push('release'),
  })
  context.after(drag.destroy)
  return { element, calls, drag }
}

for (const pointerType of ['mouse', 'touch', 'pen']) {
  test(`${pointerType}: progress starts on pointerdown and drag only starts after 300ms`, (context) => {
    const { element, calls } = setup(context)
    pointer(element, 'pointerdown', { pointerType })
    assert.equal(element.classes.has('is-pressing'), true)
    context.mock.timers.tick(299)
    assert.deepEqual(calls, [])
    context.mock.timers.tick(1)
    assert.equal(element.classes.has('is-dragging'), true)
    pointer(element, 'pointermove', { pointerType, clientX: 20 })
    pointer(element, 'pointerup', { pointerType, clientX: 20 })
    assert.deepEqual(calls, ['start', 'move', 'move', 'end', 'release'])
    assert.equal(element.captured, null)
    assert.equal(element.classes.size, 0)
  })
}

test('early release or motion cancels the timer without changing the point', (context) => {
  const { element, calls } = setup(context)
  pointer(element, 'pointerdown')
  context.mock.timers.tick(200)
  pointer(element, 'pointerup')
  context.mock.timers.tick(400)
  pointer(element, 'pointerdown')
  pointer(element, 'pointermove', { clientX: 40 })
  context.mock.timers.tick(400)
  assert.deepEqual(calls, ['release', 'release'])
  assert.equal(element.classes.size, 0)
})

for (const reason of ['pointercancel', 'lostpointercapture', 'blur', 'hidden', 'second-pointer', 'destroy']) {
  test(`cleans up and restores the point on ${reason}`, (context) => {
    const { element, calls, drag } = setup(context)
    pointer(element, 'pointerdown')
    context.mock.timers.tick(300)
    if (reason === 'blur') element.ownerDocument.defaultView.dispatchEvent(new Event('blur'))
    else if (reason === 'hidden') {
      element.ownerDocument.hidden = true
      element.ownerDocument.dispatchEvent(new Event('visibilitychange'))
    } else if (reason === 'second-pointer') pointer(element.ownerDocument.defaultView, 'pointerdown', { pointerId: 2 })
    else if (reason === 'destroy') drag.destroy()
    else pointer(element, reason)
    assert.deepEqual(calls, ['start', 'cancel', 'release'])
    assert.equal(element.classes.size, 0)
    assert.equal(element.captured, null)
  })
}

test('requires boundary readiness and ignores secondary buttons and unrelated pointers', (context) => {
  const { element, calls } = setup(context, () => false)
  pointer(element, 'pointerdown')
  pointer(element, 'pointerdown', { button: 2 })
  context.mock.timers.tick(500)
  assert.deepEqual(calls, [])
  assert.equal(element.classes.size, 0)
})
