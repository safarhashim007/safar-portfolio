import { useEffect, useRef } from 'react'

/**
 * 0 → 1 across a tall section whose first viewport-height is sticky.
 *
 * Deliberately not ScrollTrigger + pin: pinning rewrites the document flow,
 * which is what previously fought Lenis and collapsed this page's layout.
 * A sticky child plus a rect read is the same effect with nothing to break,
 * and it reads the real scroll position, so it cannot drift out of sync.
 *
 * The value is written to a ref and to a CSS custom property rather than to
 * React state: this runs every frame and must never re-render the tree.
 */
export function useScrollProgress(
  section: React.RefObject<HTMLElement | null>,
  onFrame?: (progress: number, deltaSeconds: number) => void,
) {
  const progress = useRef(0)
  const velocity = useRef(0)
  const callback = useRef(onFrame)
  callback.current = onFrame

  useEffect(() => {
    const el = section.current
    if (!el) return

    let frame = 0
    let previous = performance.now()
    let last = progress.current

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - previous) / 1000)
      previous = now

      const rect = el.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      const raw = travel > 0 ? -rect.top / travel : rect.top < 0 ? 1 : 0
      const next = Math.max(0, Math.min(1, raw))

      progress.current = next
      velocity.current = dt > 0 ? (next - last) / dt : 0
      last = next

      el.style.setProperty('--p', next.toFixed(4))
      callback.current?.(next, dt)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [section])

  return { progress, velocity }
}
