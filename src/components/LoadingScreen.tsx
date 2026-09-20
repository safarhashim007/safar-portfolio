import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

import { artworks } from '../data/artworks'
import { media } from '../data/media'
import { useDeviceQuality } from '../hooks/useDeviceQuality'
import { pick, rung } from '../lib/image'
import { COMPACT_TEXTURE, DESKTOP_TEXTURE } from '../webgl/ringGeometry'

/* The renderer chunk — three, R3F and drei — as built. It is the single
   largest thing the first screen needs, bigger than the rest of the bundle
   put together, and until now it was neither counted nor fetched until
   after the door had already opened. Re-measure with
   `ls -l dist/assets/ArchiveRing-*.js` if the dependencies change; being a
   little out only skews the bar, never the wait. */
const RENDERER_BYTES = 880_000

/** How many drawings the still hero puts on screen. Matches IdentityHero. */
const STILL_COUNT = 6

import './loading.css'

/**
 * The door, not a progress bar.
 *
 * It waits for the fonts and for every drawing the drum is about to put on
 * screen, and then it waits for the visitor.
 *
 * The first wait is the point of the door. The hero IS the drum, and the
 * drum cannot paint until all twenty textures are decoded; opening before
 * that put people in front of a name floating over nothing, which reads as a
 * broken page rather than a loading one. So this preloads exactly the URLs
 * the renderer will ask for — same widths, same device rule — and the
 * renderer then finds them in cache.
 *
 * The second wait is the sound. A browser refuses to make one on a page
 * nobody has touched, so the click that opens the site is also the click
 * that lets the room tone start with it. Scrolling past is still allowed —
 * arriving in silence is a worse outcome than arriving without sound.
 */
export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [ready, setReady] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [done, setDone] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [total, setTotal] = useState(0)
  const quality = useDeviceQuality()
  const count = quality.webgl && !quality.reduced ? artworks.length : STILL_COUNT
  const door = useRef<HTMLButtonElement>(null)

  const dismiss = useCallback(() => setLeaving(true), [])

  /* The door is on screen now, so the pre-boot shell in index.html can go. */
  useEffect(() => {
    document.getElementById('boot')?.remove()
  }, [])

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

    /* Reduced motion and a machine without WebGL both get the still hero,
       which shows six drawings as ordinary images and never builds a drum.
       Waiting on the renderer and twenty textures there meant asking those
       visitors — the ones least served by a long wait — to sit through
       4.8 MB they would never see. */
    const drum = quality.webgl && !quality.reduced
    const ids = drum ? artworks : artworks.slice(0, STILL_COUNT)

    /* The same width the drum will ask for, chosen by the same rule, so
       these are cache hits rather than a second download. */
    const width = quality.low ? COMPACT_TEXTURE : DESKTOP_TEXTURE

    /* Weigh the wait in bytes, because the parts are nothing like equal: a
       2 MB photograph and a 60 KB one are not one file each, and the
       renderer alone outweighs a third of the drawings. The image sizes are
       exact — build-media.py records them — so the only estimate here is the
       chunk. */
    const total =
      (drum ? RENDERER_BYTES : 0) +
      ids.reduce((sum, art) => sum + (media.art[art.id]?.bytes[rung('art', art.id, width)] ?? 0), 0)

    const advance = (bytes: number) => {
      if (!cancelled) setLoaded((n) => n + bytes)
    }

    /* Pulling the renderer here does two jobs: it is counted, and it is in
       cache by the time the hero mounts, so the drum no longer starts
       downloading after the visitor has been let in. */
    const renderer = drum
      ? import('../webgl/ArchiveRing')
          .catch(() => {})
          .finally(() => advance(RENDERER_BYTES))
      : Promise.resolve()

    const images = ids.map((art) => {
      const image = new Image()
      image.src = pick('art', art.id, width)
      return image
        .decode()
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setDone((n) => n + 1)
          advance(media.art[art.id]?.bytes[rung('art', art.id, width)] ?? 0)
        })
    })

    setTotal(total)

    /* Long enough for the whole first screen on a real connection, short
       enough that a stalled asset cannot hold the door shut. The old cap was
       2.5s, which the drum's textures never once beat. */
    void Promise.all([
      Promise.race([
        Promise.allSettled([document.fonts.ready, renderer, ...images]),
        delay(15000),
      ]),
      delay(reduced ? 0 : 850),
    ]).then(() => {
      if (!cancelled) setReady(true)
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      document.body.style.overflow = overflow
    }
  }, [quality.low, quality.webgl, quality.reduced])

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
      /* The share of the first screen that has arrived, 0 to 1. The rule
         along the foot is drawn from it, so the bar and the count are two
         readings of one number rather than two things kept in step. */
      style={{ '--load': ready ? 1 : total ? Math.min(1, loaded / total) : 0 } as CSSProperties}
      data-leaving={leaving}
      data-ready={ready || undefined}
      data-lenis-prevent
      disabled={!ready}
      aria-label="Enter the portfolio"
      onClick={dismiss}
    >
      <span className="loading-top readout" aria-hidden="true">
        <span>ssaff.666</span>
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
          {ready
            ? 'Enter'
            : total && loaded < RENDERER_BYTES
              ? 'Loading renderer'
              : `Loading ${String(done).padStart(2, '0')} / ${count}`}
        </span>
        <span aria-hidden="true">Kochi, India</span>
      </span>
    </button>
  )
}
