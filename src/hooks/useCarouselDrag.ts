import { useCallback, useRef } from 'react'

export interface DragState {
  /** Accumulated rotation offset, radians. */
  offset: number
  /** Radians per second, decays on release. */
  spin: number
  dragging: boolean
  /** True once the pointer moved past the slop threshold. */
  moved: boolean
  lastInput: number
}

interface Options {
  /** Radians of rotation per pixel of horizontal travel. */
  sensitivity?: number
  /** Ignore the gesture unless it starts out horizontal-dominant. */
  requireHorizontal?: boolean
  disabled?: boolean
  /** Don't capture gestures that begin on real content, e.g. selectable text. */
  ignore?: (target: EventTarget | null) => boolean
}

const SLOP = 6

/**
 * Pointer rotation that never competes with the page scroll.
 *
 * On a fine pointer a drag rotates immediately. On touch the gesture is only
 * claimed once it is clearly horizontal, so a vertical swipe stays a scroll —
 * the page is never made to feel stuck.
 */
export function useCarouselDrag({
  sensitivity = 0.0052,
  requireHorizontal = false,
  disabled = false,
  ignore,
}: Options = {}) {
  const state = useRef<DragState>({
    offset: 0,
    spin: 0,
    dragging: false,
    moved: false,
    lastInput: 0,
  })
  const gesture = useRef({ x: 0, y: 0, startX: 0, startY: 0, time: 0, claimed: false, id: -1 })

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || event.button !== 0) return
      if (ignore?.(event.target)) return
      const s = state.current
      const g = gesture.current
      s.dragging = true
      s.moved = false
      s.spin = 0
      s.lastInput = performance.now()
      g.x = g.startX = event.clientX
      g.y = g.startY = event.clientY
      g.time = s.lastInput
      g.claimed = !requireHorizontal
      g.id = event.pointerId
    },
    [disabled, requireHorizontal, ignore],
  )

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const s = state.current
      const g = gesture.current
      if (!s.dragging) return

      const dx = event.clientX - g.startX
      const dy = event.clientY - g.startY

      if (!g.claimed) {
        if (Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx)) {
          // Vertical intent: hand the gesture back to the page.
          s.dragging = false
          return
        }
        if (Math.abs(dx) <= SLOP) return
        g.claimed = true
      }

      if (Math.abs(dx) > SLOP || Math.abs(dy) > SLOP) {
        s.moved = true
        const el = event.currentTarget as HTMLElement
        if (!el.hasPointerCapture(event.pointerId)) el.setPointerCapture(event.pointerId)
      }

      const now = performance.now()
      const step = (event.clientX - g.x) * sensitivity
      const dt = Math.max(1 / 120, (now - g.time) / 1000)

      s.offset += step
      s.spin = Math.max(-6, Math.min(6, step / dt))
      s.lastInput = now
      g.x = event.clientX
      g.time = now
    },
    [sensitivity],
  )

  const release = useCallback((event: React.PointerEvent) => {
    const s = state.current
    if (!s.dragging) return
    s.dragging = false
    s.lastInput = performance.now()
    // A pointer that stopped before lifting should not throw the carousel.
    if (s.lastInput - gesture.current.time > 90) s.spin = 0
    const el = event.currentTarget as HTMLElement
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId)
  }, [])

  const cancel = useCallback(() => {
    const s = state.current
    s.dragging = false
    s.spin = 0
  }, [])

  return {
    state,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: cancel,
    },
  }
}
