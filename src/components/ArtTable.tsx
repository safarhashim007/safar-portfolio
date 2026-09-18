import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { artworks } from '../data/artworks'
import { media } from '../data/media'
import { full, source } from '../lib/image'
import { layoutTable } from '../lib/table'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useScrollVelocity } from '../hooks/useScrollVelocity'
import { useElementParallax } from '../hooks/useElementParallax'
import './art.css'

/** 9:16 for the two pieces composed to be cropped to their neighbours' ratio. */
const CROPPED_ASPECT = 9 / 16

/**
 * Drawn by hand — a studio table.
 *
 * The drawings are laid out as they would be on a working surface: overlapping,
 * each at its own slight angle, later ones resting on earlier ones. Hovering or
 * focusing a print straightens and lifts it, the way you would turn one towards
 * the light; clicking opens it properly.
 *
 * The page scrolls normally past the table — nothing is pinned and nothing is
 * shown one at a time. The previous version was a sticky arc that advanced a
 * single drawing per third of a screen, which meant six screens of scrolling to
 * see fifteen pieces of work.
 *
 * Every position comes from layoutTable() in fractions of the table's own
 * width, so one measured custom property scales the whole composition and a
 * resize costs one multiplication rather than a relayout.
 */
export default function ArtTable({ onOpen }: { onOpen: (index: number) => void }) {
  const section = useRef<HTMLElement>(null)
  const surface = useRef<HTMLOListElement>(null)
  const [width, setWidth] = useState(0)
  const compact = useMediaQuery('(max-width: 700px)')
  useElementParallax(section, '.art-print')
  useScrollVelocity(section, { pixels: 90 })

  const layout = useMemo(
    () =>
      layoutTable(
        artworks.map((art) =>
          art.crop ? CROPPED_ASPECT : (media.art[art.id]?.w ?? 3) / (media.art[art.id]?.h ?? 4),
        ),
        compact,
      ),
    [compact],
  )

  // One measurement feeds every position; --tw is the unit the table is drawn in.
  useEffect(() => {
    const el = surface.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="art" id="art" ref={section} aria-labelledby="art-title">
      <header className="art-head">
        <span className="readout">02 / Drawn by hand</span>
        <h2 className="h2" id="art-title" data-reveal>
          Drawn
          <br />
          by hand
        </h2>
        <p className="lead art-head-lead" data-reveal data-reveal-delay="1">
          Studies, sketchbooks and finished pieces, laid out as they were made.
        </p>
        <p className="readout art-head-count">
          {String(artworks.length).padStart(2, '0')} works · ongoing
        </p>
      </header>

      <ol
        className="art-table"
        ref={surface}
        style={{ '--tw': `${width}px`, height: `calc(var(--tw) * ${layout.height})` } as CSSProperties}
        aria-label="Drawings and studies"
      >
        {artworks.map((art, index) => {
          const place = layout.items[index]
          const image = source('art', art.id)

          return (
            <li
              className="art-print"
              key={art.id}
              style={
                {
                  '--x': place.x,
                  '--y': place.y,
                  '--w': place.w,
                  '--rot': place.rot,
                  '--z': place.z,
                  '--depth': 0.7 + (index % 5) * 0.18,
                } as CSSProperties
              }
            >
              <button
                type="button"
                className="art-print-lift"
                onClick={() => onOpen(index)}
                data-reveal
              >
                <span
                  className={`art-print-mat${art.crop ? ' art-print-mat--crop' : ''}`}
                  style={{ aspectRatio: `${place.w} / ${place.h}` }}
                >
                  <img
                    src={full('art', art.id)}
                    sizes="(max-width: 700px) 60vw, 24vw"
                    width={image.width}
                    height={image.height}
                    alt={art.description}
                    loading={index < 6 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                  />
                </span>

                <span className="art-print-label readout">
                  <span>{art.id}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
