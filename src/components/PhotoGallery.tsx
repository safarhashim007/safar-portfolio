import { useRef } from 'react'

import { photos } from '../data/photos'
import { full, source } from '../lib/image'
import { useScrollVelocity } from '../hooks/useScrollVelocity'
import { useElementParallax } from '../hooks/useElementParallax'
import './photo.css'

/**
 * Through the lens.
 *
 * The one inversion in the palette: photographs are hung on ink, because a
 * print needs a dark mat to be read properly. Motion here is quicker than in
 * the drawings — each frame is uncovered by a mask travelling up it, and the
 * photograph lags inside its own window as the page moves — but nothing is
 * applied to the photograph itself. It is never tinted, warped or cropped.
 *
 * This ran on a shared WebGL canvas at first. The canvas is gone: everything
 * it was there to do, a mask and a few pixels of lag, CSS does natively, and
 * the version that could be seen working is worth more than the version that
 * could not.
 */
export default function PhotoGallery() {
  const section = useRef<HTMLElement>(null)
  useElementParallax(section, '.photo-frame, .photo-scene')
  useScrollVelocity(section)

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

      <div className="photo-grid" id="photo-collection">
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
                {/* The lag layer is separate from the image so the two
                    transforms do not share a transition: the reveal needs one,
                    the per-frame velocity must not have one, or every frame's
                    update is smeared over the transition and the photograph
                    swims instead of lagging. */}
                <span className="photo-lag">
                  <img
                    src={full('photo', photo.id)}
                    sizes="(max-width: 600px) 92vw, (max-width: 1000px) 46vw, 30vw"
                    width={image.width}
                    height={image.height}
                    alt={photo.description}
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </span>
              </div>

              <figcaption className="photo-caption readout">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{photo.year}</span>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </section>
  )
}
