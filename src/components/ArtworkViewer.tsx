import { useEffect, useRef } from 'react'

import { artworks } from '../data/artworks'
import { full, thumb } from '../lib/image'
import { media } from '../data/media'
import './viewer.css'

interface Props {
  index: number | null
  onChange: (index: number) => void
  onClose: () => void
}

/** A closer look, in the proportions it was drawn in. */
export default function ArtworkViewer({ index, onChange, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const lastWheel = useRef(0)
  const open = index !== null

  useEffect(() => {
    if (!open) return
    const el = dialog.current
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow

    el?.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      el?.close()
      document.body.style.overflow = overflow
      previous?.focus({ preventScroll: true })
    }
  }, [open])

  const art = index === null ? null : artworks[index]
  const entry = art ? media.art[art.id] : undefined
  const step = (direction: number) =>
    onChange(((index ?? 0) + direction + artworks.length) % artworks.length)

  return (
    <dialog
      className="viewer"
      ref={dialog}
      aria-label="Artwork detail"
      data-lenis-prevent
      onCancel={onClose}
      onClose={() => {
        if (open) onClose()
      }}
      onWheel={(event) => {
        if (Math.abs(event.deltaY) < 18 || performance.now() - lastWheel.current < 680) return
        lastWheel.current = performance.now()
        step(event.deltaY > 0 ? 1 : -1)
      }}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        step(event.key === 'ArrowRight' ? 1 : -1)
      }}
    >
      {art && (
        <>
          <header className="viewer-bar">
            <span className="readout">
              Art file {art.id} / {String(artworks.length).padStart(2, '0')}
            </span>
            <button type="button" className="readout viewer-close" autoFocus onClick={onClose}>
              Close<span aria-hidden="true"> ×</span>
            </button>
          </header>

          <div className="viewer-body">
            <div className="viewer-image">
              <img
                key={art.id}
                src={full('art', art.id)}
                width={entry?.w}
                height={entry?.h}
                alt={art.description}
              />
            </div>

          </div>

          <footer className="viewer-strip">
            <button type="button" className="readout" onClick={() => step(-1)}>
              <span aria-hidden="true">←</span>
              <span className="visually-hidden">Previous artwork</span>
            </button>

            <ol aria-label="All artwork">
              {artworks.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onChange(i)}
                    aria-current={index === i ? 'true' : undefined}
                  >
                    <img
                      src={thumb('art', item.id)}
                      width={media.art[item.id]?.w}
                      height={media.art[item.id]?.h}
                      alt={item.description}
                      loading="lazy"
                    />
                  </button>
                </li>
              ))}
            </ol>

            <button type="button" className="readout" onClick={() => step(1)}>
              <span aria-hidden="true">→</span>
              <span className="visually-hidden">Next artwork</span>
            </button>
          </footer>
        </>
      )}
    </dialog>
  )
}
