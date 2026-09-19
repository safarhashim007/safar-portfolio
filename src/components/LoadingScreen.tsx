import { useCallback, useEffect, useRef, useState } from 'react'

import { thumb } from '../lib/image'

import './loading.css'

/**
 * The door, not a progress bar.
 *
 * It waits for the fonts and the first drawings, and then it waits for the
 * visitor. That second wait is the point: a browser refuses to make a sound
 * on a page nobody has touched, so the click that opens the site is also the
 * click that lets the room tone start with it. Scrolling past is still
 * allowed — arriving in silence is a worse outcome than arriving without
 * sound.
 */
export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [ready, setReady] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const door = useRef<HTMLButtonElement>(null)

  const dismiss = useCallback(() => setLeaving(true), [])

  // ---- the work ---------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms))
      })
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const images = ['01', '02', '03'].map((id) => {
      const image = new Image()
      image.src = thumb('art', id)
      return image.decode()
    })

    void Promise.all([
      Promise.race([Promise.allSettled([document.fonts.ready, ...images]), delay(2500)]),
      delay(reduced ? 0 : 850),
    ]).then(() => {
      if (!cancelled) setReady(true)
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      document.body.style.overflow = overflow
    }
  }, [])

  // ---- the invitation ---------------------------------------------------
  useEffect(() => {
    if (!ready) return
    door.current?.focus({ preventScroll: true })

    /* A visitor who reaches for the scroll wheel has answered the door in
       their own way. It is not the gesture that unlocks sound, but being
       held behind a splash screen is the worse failure. */
    const escape = () => setLeaving(true)
    window.addEventListener('wheel', escape, { passive: true, once: true })
    window.addEventListener('touchmove', escape, { passive: true, once: true })
    return () => {
      window.removeEventListener('wheel', escape)
      window.removeEventListener('touchmove', escape)
    }
  }, [ready])

  // ---- the exit ---------------------------------------------------------
  useEffect(() => {
    if (!leaving) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = setTimeout(onComplete, reduced ? 0 : 650)
    return () => clearTimeout(timer)
  }, [leaving, onComplete])

  return (
    <button
      type="button"
      ref={door}
      className="loading-screen"
      data-leaving={leaving}
      data-ready={ready || undefined}
      data-lenis-prevent
      disabled={!ready}
      aria-label="Enter the portfolio"
      onClick={dismiss}
    >
      <span className="loading-top readout" aria-hidden="true">
        <span>Safar ©26</span>
        <span>Portfolio / 2026</span>
      </span>

      <span className="loading-identity" aria-hidden="true">
        <span className="loading-name">
          Safar
          <br />
          Hashim
        </span>
        <span className="loading-disciplines readout">Code · Drawing · Photography</span>
      </span>

      <span className="loading-bottom readout">
        <span className="loading-status" aria-live="polite">
          {ready ? 'Enter' : 'Loading portfolio'}
        </span>
        <span aria-hidden="true">Kochi, India</span>
      </span>
    </button>
  )
}
