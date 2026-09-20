import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Scroll stays native in feel and native in behaviour: the wheel is never
 * intercepted to mean something else, the scrollbar is real, and anchors still
 * work. Lenis only smooths the interpolation, and it is switched off entirely
 * for reduced motion and for touch, where the platform's own inertia is better
 * than anything we would add.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (matchMedia('(pointer: coarse)').matches) return

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, anchors: true })
    const galleryNavigate = (event: Event) => {
      event.preventDefault()
      lenis.scrollTo((event as CustomEvent<number>).detail, { immediate: true, force: true })
    }
    window.addEventListener('gallery:navigate', galleryNavigate)
    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }

    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('gallery:navigate', galleryNavigate)
      lenis.destroy()
    }
  }, [])

  return null
}
