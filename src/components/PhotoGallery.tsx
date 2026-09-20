import { useRef, useState } from 'react'

import { photos } from '../data/photos'
import { full, source } from '../lib/image'
import ArtworkViewer from './ArtworkViewer'
import { useElementParallax } from '../hooks/useElementParallax'
import './photo.css'

export default function PhotoGallery() {
  const section = useRef<HTMLElement>(null)
  const [activePhoto, setActivePhoto] = useState<number | null>(null)
  useElementParallax(section, '.photo-scene')

  return (
    <section className="photo on-dark" id="photography" ref={section} aria-labelledby="photo-title">
      <header className="photo-scene">
        <img className="photo-scene-image" src={full('photo', '26')} width={1080} height={1920} alt="" loading="lazy" />
        <span className="photo-scene-kicker readout">03 / Photography</span>
        <h2 className="photo-scene-title" id="photo-title">
          Through
          <br />
          <em>the lens.</em>
        </h2>
        <div className="photo-scene-foot readout">
          <span>{photos.length} frames · 2024—26</span>
          <a href="#photo-collection">Explore the collection <span aria-hidden="true">↓</span></a>
        </div>
      </header>

      <div className="photo-collection-bar readout" id="photo-collection">
        <span>Photo archive / {photos.length} frames</span>
        <span>Tap a frame to view ↗</span>
      </div>
      <div className="photo-grid">
        {photos.map((photo, index) => {
          const image = source('photo', photo.id)

          return (
            <figure className="photo-item" key={photo.id}>
              <div
                className="photo-frame"
                data-photo={photo.id}
                data-reveal
                style={{ aspectRatio: `${image.width} / ${image.height}` }}
              >
                <button type="button" className="photo-lag" onClick={() => setActivePhoto(index)} aria-label={`View photograph ${index + 1}: ${photo.description}`} aria-haspopup="dialog">
                  <img
                    /* source() was already being built here and only its
                       dimensions were used: the ladder went unread, sizes had
                       no srcSet to choose from, and every frame loaded its
                       largest rung — 13.9 MB of photographs on a phone that
                       needs 3.1. */
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes="(max-width: 600px) 92vw, (max-width: 1000px) 46vw, 30vw"
                    width={image.width}
                    height={image.height}
                    alt={photo.description}
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </button>
              </div>

              <figcaption className="photo-caption readout">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{photo.year}</span>
              </figcaption>
            </figure>
          )
        })}
      </div>
      {/* The sheet has a ragged bottom by nature — the columns are balanced as
          evenly as twenty frames of these proportions allow — so it is closed
          the same way it is opened, with a rule. Without it the archive just
          stopped and the short column's gap read as a fault. */}
      <div className="photo-collection-bar photo-collection-foot readout">
        <span>End of archive</span>
        <a href="#home">Back to top <span aria-hidden="true">↑</span></a>
      </div>

      <ArtworkViewer collection="photo" index={activePhoto} onChange={setActivePhoto} onClose={() => setActivePhoto(null)} />
    </section>
  )
}
