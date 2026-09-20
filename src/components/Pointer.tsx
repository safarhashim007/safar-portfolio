import { useEffect, useRef } from 'react'

import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../hooks/useReducedMotion'

import './pointer.css'

/* How far the dot travels toward the cursor each frame. The native pointer
   is exact; this one arrives a beat later, which is the only thing that makes
   a drawn dot read as a physical object rather than a stuck sprite. */
const FOLLOW = 0.18

/**
 * A dot that follows the pointer, and nothing else.
 *
 * It exists only where a real pointer does — never on touch, where it would
 * be a sprite stranded wherever the last tap landed — and it is drawn with
 * difference blending, so one dot stays visible over paper, over ink, over
 * the drum and over a photograph without needing a second colour.
 */
export default function Pointer() {
  const ring = useRef<HTMLDivElement>(null)
  const fine = useMediaQuery('(pointer: fine)')
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ring.current
    if (!el || !fine) return

    let frame = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let toX = x
    let toY = y
    let seen = false

    const draw = () => {
      /* Reduced motion gets the position with no easing: the ring still
         tracks, it just does not trail. */
      const k = reduced ? 1 : FOLLOW
      x += (toX - x) * k
      y += (toY - y) * k
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`
      frame = requestAnimationFrame(draw)
    }

    const move = (event: PointerEvent) => {
      toX = event.clientX
      toY = event.clientY
      if (!seen) {
        /* Jump to the first real position rather than gliding in from the
           middle of the screen. */
        seen = true
        x = toX
        y = toY
        el.dataset.on = 'true'
      }
    }

    /* Presence is the only state: a dot left behind when the cursor has gone
       to another window is a bug the visitor can see. */
    const leave = () => { el.dataset.on = 'false' }
    const enter = () => { if (seen) el.dataset.on = 'true' }

    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    document.addEventListener('pointerenter', enter)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('pointerenter', enter)
    }
  }, [fine, reduced])

  if (!fine) return null

  return <div className="pointer" ref={ring} data-on="false" aria-hidden="true" />
}
