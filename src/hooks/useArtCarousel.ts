import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from './useMediaQuery'
import { galleryPose, wrapGalleryIndex as wrap } from '../lib/gallery'

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

/** Full-resolution DOM images follow a shallow arc; only active movement runs a frame loop. */
export function useArtCarousel(count: number, onOpen: (index: number) => void) {
  const stage = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    const element = stage.current
    if (!element || !count) return
    const cards = Array.from(element.querySelectorAll<HTMLElement>('.art-print'))
    const images = cards.map((card) => card.querySelector('img'))
    let position = 0
    let target = 0
    let step = 1
    let frame = 0
    let previousTime = 0
    let snapTimer = 0
    let selected = -1
    let suppressClick = false
    let pointer: { id: number; x: number; y: number; origin: number; lastX: number; time: number; velocity: number; dragging: boolean } | null = null

    const paint = () => {
      const visible = element.clientWidth / step / 2 + 1.5
      cards.forEach((card, index) => {
        const pose = galleryPose(index, position, count, step, reduced)
        const distance = Math.abs(pose.offset)
        // Load the next few originals before they reach the visible arc.
        const image = images[index]
        if (distance < visible + 2 && image?.loading === 'lazy') image.loading = 'eager'
        card.style.visibility = distance < visible ? 'visible' : 'hidden'
        card.style.zIndex = String(Math.round(100 - distance * 10))
        card.style.transform = `translate(-50%, -50%) translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateY(${pose.rotateY}deg) rotateZ(${pose.rotateZ}deg)`
      })
      const next = wrap(Math.round(position), count)
      if (next !== selected) { selected = next; setActive(next) }
    }
    const tick = (time: number) => {
      frame = 0
      const delta = Math.min((time - previousTime) / 1000 || 1 / 60, 0.05)
      previousTime = time
      position += (target - position) * (reduced ? 1 : 1 - Math.exp(-14 * delta))
      if (Math.abs(target - position) < 0.001) position = target
      paint()
      if (position !== target) frame = requestAnimationFrame(tick)
    }
    const animate = () => {
      if (!frame) { previousTime = performance.now(); frame = requestAnimationFrame(tick) }
    }
    const resize = () => {
      step = cards[0].offsetWidth + Math.max(18, Math.min(element.clientWidth * 0.024, 32))
      paint()
    }
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return
      clearTimeout(snapTimer)
      suppressClick = false
      target = position
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: position, lastX: event.clientX, time: performance.now(), velocity: 0, dragging: false }
    }
    const move = (event: PointerEvent) => {
      if (!pointer || event.pointerId !== pointer.id) return
      const dx = event.clientX - pointer.x
      const dy = event.clientY - pointer.y
      if (!pointer.dragging) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { pointer = null; return }
        if (Math.abs(dx) < 8) return
        pointer.dragging = true
        suppressClick = true
        element.setPointerCapture(event.pointerId)
        element.dataset.dragging = 'true'
      }
      const time = performance.now()
      pointer.velocity = (event.clientX - pointer.lastX) / Math.max(time - pointer.time, 1)
      pointer.lastX = event.clientX
      pointer.time = time
      target = pointer.origin - dx / step
      animate()
    }
    const up = (event: PointerEvent) => {
      if (!pointer || event.pointerId !== pointer.id) return
      if (pointer.dragging) {
        const velocity = performance.now() - pointer.time < 100 ? pointer.velocity : 0
        target = Math.round(target - (reduced || event.type === 'pointercancel' ? 0 : clamp(velocity * 170 / step, 2)))
        animate()
      }
      pointer = null
      delete element.dataset.dragging
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    }
    const click = (event: MouseEvent) => {
      if (!suppressClick) return
      event.preventDefault()
      event.stopPropagation()
      suppressClick = false
    }
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      event.stopPropagation()
      target += clamp(event.deltaX * (event.deltaMode === 1 ? 16 : 1) / step, 1)
      animate()
      clearTimeout(snapTimer)
      snapTimer = window.setTimeout(() => { target = Math.round(target); animate() }, 140)
    }
    const key = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        element.focus({ preventScroll: true })
        clearTimeout(snapTimer)
        target = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : Math.round(target) + (event.key === 'ArrowRight' ? 1 : -1)
        animate()
      } else if (event.target === element && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        onOpen(wrap(Math.round(target), count))
      }
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    element.addEventListener('click', click, true)
    element.addEventListener('wheel', wheel, { passive: false })
    element.addEventListener('keydown', key)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(snapTimer)
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
      element.removeEventListener('click', click, true)
      element.removeEventListener('wheel', wheel)
      element.removeEventListener('keydown', key)
    }
  }, [count, onOpen, reduced])
  return { stage, active }
}
