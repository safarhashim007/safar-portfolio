import { Suspense, lazy, useEffect, useRef, useState } from 'react'

import { artworks } from '../data/artworks'
import { media } from '../data/media'
import { source } from '../lib/image'
import { useCarouselDrag } from '../hooks/useCarouselDrag'
import { useDeviceQuality } from '../hooks/useDeviceQuality'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { nameFrame } from '../webgl/ringGeometry'

// Nothing 3D is in the first load: the name and the frame paint, then the
// renderer arrives. This is also what keeps three out of the entry chunk.
const ArchiveRing = lazy(() => import('../webgl/ArchiveRing'))
import './hero.css'

/**
 * The name is inside the work.
 *
 * SAFAR HASHIM is real, selectable HTML sitting *behind* a transparent canvas.
 * The drum of artwork in front of it is opaque geometry with genuine depth, so
 * at the top of the page the letters are physically covered — only the seams
 * between cards let fragments through. Scrolling turns, opens and finally
 * stands the drum aside, and the type is uncovered.
 *
 * Its opacity never changes. Legibility here is a fact about geometry, not a
 * property animated on the text, which is the whole point: the identity is
 * recovered from the work rather than announced over it.
 */
export default function IdentityHero() {
  const section = useRef<HTMLElement>(null)
  const name = useRef<HTMLHeadingElement>(null)
  const quality = useDeviceQuality()
  const [selected, setSelected] = useState(0)
  const [active, setActive] = useState(true)
  const request = useRef<number | null>(null)
  const progress = useRef(0)
  const anchor = useRef<HTMLDivElement>(null)
  /** Measured on resize only — reading layout every frame is what makes a
   *  scroll-driven transform stutter. */
  const metrics = useRef({
    width: 0,
    height: 0,
    gutter: 24,
    viewportWidth: 0,
    viewportHeight: 0,
  })

  /* With no renderer there is no drum to uncover the name, so there is nothing
     for a scroll sequence to do: the hero is one screen and the name is
     already where it belongs. Same for reduced motion. */
  const still = quality.reduced || !quality.webgl

  const { state: drag, handlers } = useCarouselDrag({
    // On touch the gesture is only claimed once it is clearly horizontal, so
    // a vertical swipe still scrolls the page.
    requireHorizontal: quality.touch,
    disabled: quality.reduced,
    // A pointer that lands on the name is there to select text, not to turn
    // the archive, so the heading stays genuinely selectable.
    ignore: (target) => target instanceof Element && Boolean(target.closest('.hero-name, .hero-frame')),
  })

  // The name's unscaled box and the page's own left margin, remeasured only
  // when the viewport changes. The margin is read off a zero-size anchor so
  // the value always agrees with the --gutter token rather than repeating it.
  useEffect(() => {
    const el = name.current
    if (!el) return

    const measure = () => {
      metrics.current = {
        width: el.offsetWidth,
        height: el.offsetHeight,
        gutter: anchor.current?.offsetLeft ?? 24,
        viewportWidth: window.innerWidth,
        viewportHeight: el.parentElement?.clientHeight ?? window.innerHeight,
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    observer.observe(document.documentElement)
    // Web fonts land after first paint and change the name's width.
    document.fonts?.ready.then(measure).catch(() => {})
    return () => observer.disconnect()
  }, [])

  useScrollProgress(section, (p) => {
    progress.current = p

    const el = name.current
    if (!el || still) return

    // Deep inside the drum it is centred on the drum's axis; by the end it has
    // come forward and settled into the page's own margin. The same function
    // drives the occlusion measurement in scripts/ring-check.mjs.
    const { x, y, scale } = nameFrame(still ? 1 : p, {
      ...metrics.current,
      compact: quality.low,
    })

    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`
  })

  // The renderer is stopped outright when the hero leaves the viewport.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: '10% 0px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])


  return (
    <section
      className={`hero${still ? ' hero--still' : ''}`}
      id="home"
      aria-labelledby="hero-name"
      ref={section}
      {...handlers}
    >
      <div className="hero-stage">
        <div className="hero-anchor" ref={anchor} aria-hidden="true" />

        <h1 className="hero-name" id="hero-name" ref={name}>
          <span>Safar</span>
          <span>Hashim</span>
        </h1>

        {quality.webgl ? (
          <Suspense fallback={null}>
            <ArchiveRing
              progress={progress}
              drag={drag}
              quality={quality}
              paused={false}
              onFocus={setSelected}
              request={request}
              active={active}
            />
          </Suspense>
        ) : (
          /* No WebGL: the archive is still an archive, just a still one. */
          <div className="hero-still" aria-hidden="true">
            {Array.from(
              { length: 6 },
              (_, offset) => artworks[(selected + offset) % artworks.length],
            ).map((item) => {
              const image = source('art', item.id)
              return (
                <img
                  key={item.id}
                  src={image.src}
                  srcSet={image.srcSet}
                  sizes="(max-width: 900px) 30vw, 17vw"
                  width={media.art[item.id]?.w}
                  height={media.art[item.id]?.h}
                  alt=""
                  loading="eager"
                />
              )
            })}
          </div>
        )}

        <div className="hero-frame">
          <ul className="hero-role readout">
            <li>AI &amp; ML student</li>
            <li>Developer</li>
            <li>Visual artist</li>
          </ul>

          <p className="hero-place readout">
            Kochi, India
            <span aria-hidden="true"> / </span>
            <span>2026</span>
          </p>

          {/* What is actually facing you. The drum turns on its own, so this
              is deliberately not a live region: announcing a new line every
              few seconds would make the page unusable with a screen reader,
              and every drawing is named again in the archive below. */}
          <p className="hero-readout">
            <span className="hero-readout-title readout readout--live">
              Artwork {artworks[selected]?.id}
            </span>
            <span className="hero-readout-note readout">
              {artworks[selected]?.description}
            </span>
          </p>

          <p className="hero-hint readout" aria-hidden="true">
            {still ? 'Archive shown as a still' : 'Drag to turn the archive'}
          </p>

          <a className="hero-next readout" href="#projects">
            <span>Projects</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  )
}
