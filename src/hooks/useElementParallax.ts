import { useEffect } from 'react'

/** Shift only visible frames as they cross the viewport; leaves page flow intact. */
export function useElementParallax(
  section: React.RefObject<HTMLElement | null>,
  selector: string,
) {
  useEffect(() => {
    const root = section.current
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const visible = new Set<Element>()
    let frame = 0
    const update = () => {
      frame = 0
      for (const element of visible) {
        const rect = element.getBoundingClientRect()
        const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)))
        ;(element as HTMLElement).style.setProperty('--frame-progress', progress.toFixed(4))
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      }
      schedule()
    }, { rootMargin: '25% 0px' })
    root.querySelectorAll(selector).forEach((element) => observer.observe(element))
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    return () => {
      observer.disconnect()
      removeEventListener('scroll', schedule)
      removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [section, selector])
}
