import { useEffect } from 'react'

/**
 * Writes how fast the page is moving onto an element, as CSS custom
 * properties: `--v` signed, −1 to 1, and `--va` its magnitude.
 *
 * Stylesheets can then react to scroll speed, which CSS cannot observe on its
 * own. The loop only runs while the element is on screen, and the value goes
 * to the DOM rather than to React state — this happens every frame and must
 * never re-render anything.
 */
export function useScrollVelocity(
  target: React.RefObject<HTMLElement | null>,
  { pixels = 70, damping = 0.13 }: { pixels?: number; damping?: number } = {},
) {
  useEffect(() => {
    const el = target.current
    if (!el) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let last = window.scrollY
    let smoothed = 0

    const tick = () => {
      frame = requestAnimationFrame(tick)
      const now = window.scrollY
      const raw = Math.max(-1, Math.min(1, (now - last) / pixels))
      last = now
      smoothed += (raw - smoothed) * damping
      el.style.setProperty('--v', smoothed.toFixed(4))
      el.style.setProperty('--va', Math.abs(smoothed).toFixed(4))
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame) {
        last = window.scrollY
        frame = requestAnimationFrame(tick)
      } else if (!entry.isIntersecting && frame) {
        cancelAnimationFrame(frame)
        frame = 0
        smoothed = 0
        el.style.setProperty('--v', '0')
        el.style.setProperty('--va', '0')
      }
    })

    observer.observe(el)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [target, pixels, damping])
}
