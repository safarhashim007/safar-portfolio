import { useId, useState } from 'react'

import { archive, projects } from '../data/projects'
import ProjectDrawing from './ProjectDrawing'
import './work.css'

/**
 * An archive, not a set of cards.
 *
 * A row opens in place: the problem in one sentence first, then the system,
 * then what actually exists today, and only then the repository. Clicking the
 * row never leaves the site — being thrown at GitHub is not a project page.
 * Work that is not finished says so where the status belongs, every time.
 */
export default function ProjectIndex() {
  const [open, setOpen] = useState<string | null>(null)
  const base = useId()

  return (
    <section className="work" id="projects" aria-labelledby="work-title">
      <header className="work-head">
        <span className="readout">01 / Selected projects</span>
        <h2 className="h2" id="work-title" data-reveal>
          Selected
          <br />
          projects
        </h2>
        <p className="lead work-head-lead" data-reveal data-reveal-delay="1">
          Software, machine learning and research — built, and being built.
        </p>
        <p className="readout work-head-count">
          {String(projects.length).padStart(2, '0')} current ·{' '}
          {String(archive.length).padStart(2, '0')} archived · 2025—26
        </p>
      </header>

      <div className="work-list">
        {projects.map((project) => {
          const isOpen = open === project.slug
          const panel = `${base}-${project.slug}`

          return (
            <article className={`work-row${isOpen ? ' is-open' : ''}`} key={project.slug}>
              <h3 className="work-row-heading">
                <button
                  type="button"
                  className="work-row-button"
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => setOpen(isOpen ? null : project.slug)}
                >
                  <span className="readout work-row-number">{project.number}</span>

                  <span className="work-row-title">{project.title}</span>

                  <span className="work-row-meta">
                    <span className="readout">{project.domain}</span>
                    <span className="readout">{project.year}</span>
                    <span
                      className={`readout work-status${
                        project.status === 'BUILT' ? '' : ' work-status--live'
                      }`}
                    >
                      {project.status}
                    </span>
                  </span>

                  <span className="work-row-toggle" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
              </h3>

              {/* `inert` keeps a collapsed panel out of the tab order and out
                  of the accessibility tree while still letting the row height
                  animate — `hidden` would cancel the transition. */}
              <div
                className="work-panel"
                id={panel}
                role="region"
                aria-label={`${project.title} detail`}
                inert={!isOpen}
              >
                <div className="work-panel-inner">
                  <p className="work-problem">{project.problem}</p>

                  <ProjectDrawing project={project} />

                  <div className="work-detail">
                    <div>
                      <span className="readout">System</span>
                      <p>{project.description}</p>
                    </div>

                    <div>
                      <span className="readout">Current state</span>
                      <p>{project.state}</p>
                    </div>

                    <dl className="work-spec">
                      <div>
                        <dt className="readout">Stack</dt>
                        <dd className="readout-lg">{project.stack}</dd>
                      </div>
                      <div>
                        <dt className="readout">Status</dt>
                        <dd
                          className={`readout-lg${
                            project.status === 'BUILT' ? '' : ' work-status--live'
                          }`}
                        >
                          {project.status}
                        </dd>
                      </div>
                      <div>
                        <dt className="readout">Source</dt>
                        <dd className="readout-lg">
                          {project.repo ? (
                            <a href={project.repo} target="_blank" rel="noreferrer">
                              GitHub<span aria-hidden="true"> ↗</span>
                            </a>
                          ) : (
                            'Not public'
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <section className="work-archive" aria-labelledby="work-archive-title">
        <div className="work-archive-head">
          <h3 className="readout" id="work-archive-title">
            Project archive
          </h3>
          <span className="readout">05—08</span>
        </div>

        <ul>
          {archive.map((project) => (
            <li className="work-archive-row" key={project.number}>
              <span className="readout work-row-number">{project.number}</span>
              <h4>{project.title}</h4>
              <span className="readout">{project.domain}</span>
              <span className="readout">{project.year}</span>
              {project.repo ? (
                <a className="readout" href={project.repo} target="_blank" rel="noreferrer">
                  GitHub<span aria-hidden="true"> ↗</span>
                </a>
              ) : (
                <span className="readout" aria-hidden="true">
                  —
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
