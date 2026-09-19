import { artworks } from '../data/artworks'
import { full, source } from '../lib/image'
import { useArtCarousel } from '../hooks/useArtCarousel'
import './art.css'

export default function ArtTable({ onOpen }: { onOpen: (index: number) => void }) {
  const { stage, active } = useArtCarousel(artworks.length, onOpen)

  return (
    <section className="art" id="art" aria-labelledby="art-title">
      <header className="art-head">
        <span className="readout">02 / Drawn by hand</span>
        <h2 className="h2" id="art-title" data-reveal>Drawn<br />by hand</h2>
        <p className="readout art-head-lead" data-reveal>Drag to explore · Click to view</p>
      </header>
      <div className="art-carousel" ref={stage} role="group" aria-roledescription="carousel"
        aria-label="Drawing gallery" aria-describedby="art-instructions" tabIndex={0}>
        <p className="visually-hidden" id="art-instructions">
          Drag or swipe horizontally to browse. Use the left and right arrow keys to move
          between drawings, Home or End to jump, and Enter to open the selected drawing.
        </p>
        <ol className="art-track" aria-label="Drawings and studies">
          {artworks.map((art, index) => {
            const image = source('art', art.id)
            return (
              <li className="art-print" key={art.id}>
                <button type="button" className="art-print-lift" tabIndex={-1}
                  aria-label={`Open drawing ${art.id}: ${art.description}`}
                  aria-current={index === active ? 'true' : undefined} onClick={() => onOpen(index)}>
                  <span className={`art-print-mat${art.crop ? ' art-print-mat--crop' : ''}`}>
                    <img src={full('art', art.id)} width={image.width} height={image.height}
                      alt={art.description} loading={index < 3 || index > artworks.length - 3 ? 'eager' : 'lazy'}
                      decoding="async" draggable={false} />
                  </span>
                  <span className="art-print-label readout" aria-hidden="true">{art.id}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      <footer className="art-gallery-footer readout">
        <span>Drawings & studies</span>
        <span aria-live="polite" aria-atomic="true">
          <span className="visually-hidden">Selected drawing </span>
          {String(active + 1).padStart(2, '0')} / {String(artworks.length).padStart(2, '0')}
        </span>
        <span>Drag / Swipe <span aria-hidden="true">↔</span></span>
      </footer>
    </section>
  )
}
