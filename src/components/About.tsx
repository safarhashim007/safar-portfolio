import { useState } from 'react'
import { media } from '../data/media'
import { source } from '../lib/image'
import './about.css'

/* One glimpse per strand named in the statement, so the stack is evidence
   for the sentence beside it rather than decoration. Dimensions come from
   the manifest: hard-coding them is how a stack starts reserving the wrong
   box and shifting the layout when the picture lands. */
const glimpses = [
  { role: 'art' as const, id: '18', kind: 'Drawing', alt: 'Digital artwork on a tablet among green leaves' },
  { role: 'photo' as const, id: '27', kind: 'Photograph', alt: 'Green fields beneath an evening sky' },
  { role: 'art' as const, id: '16', kind: 'Drawing', alt: 'A character drawing on a tablet' },
]

/** Grouped by what the work is for, not ranked by an invented percentage. */
const capabilities = [
  {
    label: 'Machine learning',
    items: ['PYTHON', 'PYTORCH', 'COMPUTER VISION', 'MODEL EVALUATION'],
  },
  {
    label: 'Software',
    items: ['REACT', 'TYPESCRIPT', 'KOTLIN / ANDROID', 'JAVA', 'FLASK'],
  },
  {
    label: 'Working practice',
    items: ['GIT', 'DATA PIPELINES', 'TECHNICAL WRITING'],
  },
]

const tools = [
  { name: 'PROCREATE', level: 'PROFICIENT', use: 'Digital artwork, illustration' },
  { name: 'ADOBE LIGHTROOM', level: 'PROFICIENT', use: 'Photography, colour correction' },
  { name: 'CANVA', level: 'PROFICIENT', use: 'Visual design, presentations' },
  { name: 'DAVINCI RESOLVE', level: 'INTERMEDIATE', use: 'Video editing, colour' },
]

export default function About() {
  const [glimpse, setGlimpse] = useState(0)
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <header className="about-head">
        <span className="readout">04 / About</span>
        <p className="readout about-head-place">Kochi, India · 2026</p>
      </header>

      <div className="about-intro">
        <div className="about-copy" data-reveal>
          <h2 className="h2 about-title" id="about-title">
            A little<br />
            <em>about me.</em>
          </h2>
          <p className="about-statement">
            Code, a sketchbook,
            <br />
            and a camera.
          </p>
          <p className="about-bio">
            I&rsquo;m Safar, an AI and machine learning student in Kochi. I build software,
            make digital art, and take photographs. This is where I keep all three.
          </p>
          <a className="about-connect readout" href="#contact">
            Say hello <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="about-glimpses" data-reveal data-reveal-delay="1">
          <button
            className="about-stack"
            type="button"
            aria-label="Show the next piece of work"
            onClick={() => setGlimpse((current) => (current + 1) % glimpses.length)}
          >
            {glimpses.map((item, index) => {
              const entry = media[item.role][item.id]
              const image = source(item.role, item.id)
              return (
                <img
                  key={`${item.role}-${item.id}`}
                  src={image.src}
                  srcSet={image.srcSet}
                  sizes="(max-width: 700px) 75vw, 24rem"
                  width={entry?.w}
                  height={entry?.h}
                  alt={index === glimpse ? item.alt : ''}
                  aria-hidden={index !== glimpse}
                  data-depth={(index - glimpse + glimpses.length) % glimpses.length}
                  loading="lazy"
                />
              )
            })}
          </button>

          {/* The stack was unlabelled: three pictures of his own work with
              nothing saying which strand each one belongs to. Same readout
              grammar as the drum in the hero. */}
          <p className="about-stack-note readout">
            <span className="readout--live">{glimpses[glimpse].kind}</span>
            <span>Click to shuffle</span>
            <span>{String(glimpse + 1).padStart(2, '0')} / 03</span>
          </p>
        </div>
      </div>

      <div className="about-grid">
        <div className="about-block">
          <h3 className="readout">Development</h3>
          <dl className="about-capabilities">
            {capabilities.map((group) => (
              <div key={group.label}>
                <dt className="readout">{group.label}</dt>
                <dd>
                  <ul>
                    {group.items.map((item) => (
                      <li className="readout-lg" key={item}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="about-block">
          <h3 className="readout">Creative tools</h3>
          <ul className="about-tools">
            {tools.map((tool) => (
              <li key={tool.name}>
                <span className="about-tool-name">{tool.name}</span>
                <span className="readout about-tool-use">{tool.use}</span>
                <span className="readout about-tool-level">{tool.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
