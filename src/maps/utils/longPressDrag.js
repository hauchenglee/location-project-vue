export const LONG_PRESS_MS = 300
const PRESS_SLOP_PX = 8

export const installLongPressDrag = ({ element, canStart, onStart, onMove, onEnd, onCancel, onRelease }) => {
  const view = element.ownerDocument.defaultView
  const document = element.ownerDocument
  let gesture = null
  let timer = null

  const finish = (commit = false) => {
    if (!gesture) return
    clearTimeout(timer)
    timer = null
    const current = gesture
    gesture = null
    element.classList.remove('is-pressing', 'is-dragging')
    if (element.hasPointerCapture(current.id)) element.releasePointerCapture(current.id)
    if (current.dragging) {
      if (commit) onEnd()
      else onCancel()
    }
    onRelease()
  }

  const stopEvent = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const down = (event) => {
    if (gesture || !event.isPrimary || event.button !== 0) return
    stopEvent(event)
    if (!canStart()) return
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false }
    element.setPointerCapture(event.pointerId)
    element.classList.add('is-pressing')
    timer = setTimeout(() => {
      gesture.dragging = true
      element.classList.replace('is-pressing', 'is-dragging')
      onStart({ clientX: gesture.x, clientY: gesture.y })
    }, LONG_PRESS_MS)
  }

  const move = (event) => {
    if (!gesture || event.pointerId !== gesture.id) return
    stopEvent(event)
    if (gesture.dragging) onMove(event)
    else if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > PRESS_SLOP_PX) finish()
  }

  const up = (event) => {
    if (!gesture || event.pointerId !== gesture.id) return
    stopEvent(event)
    if (gesture.dragging) onMove(event)
    finish(true)
  }

  const cancel = () => finish()
  const cancelPointer = (event) => {
    if (event.pointerId === gesture?.id) finish()
  }
  const anotherPointer = (event) => {
    if (gesture && event.pointerId !== gesture.id) finish()
  }
  const visibility = () => { if (document.hidden) finish() }

  const listeners = [
    [element, 'pointerdown', down],
    [element, 'pointermove', move],
    [element, 'pointerup', up],
    [element, 'pointercancel', cancelPointer],
    [element, 'lostpointercapture', cancelPointer],
    [element, 'mousedown', stopEvent],
    [element, 'touchstart', stopEvent, { passive: false }],
    [element, 'click', stopEvent],
    [element, 'dblclick', stopEvent],
    [element, 'contextmenu', stopEvent],
    [view, 'pointerdown', anotherPointer, true],
    [view, 'blur', cancel],
    [document, 'visibilitychange', visibility],
  ]
  listeners.forEach(([target, type, listener, options]) => target.addEventListener(type, listener, options))

  return {
    cancel,
    destroy: () => {
      finish()
      listeners.forEach(([target, type, listener, options]) => target.removeEventListener(type, listener, options))
    },
  }
}
