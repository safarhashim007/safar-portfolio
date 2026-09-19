import type { Project } from '../data/projects'

function Drawing({ slug }: { slug: Project['slug'] }) {
  switch (slug) {
    case 'chandra':
      return (
        <>
          <g className="project-drawing-muted">
            <rect x="66" y="38" width="278" height="244" />
            <rect x="656" y="38" width="278" height="244" />
            <circle cx="180" cy="122" r="44" />
            <circle cx="252" cy="213" r="21" />
            <circle cx="771" cy="117" r="50" />
            <circle cx="858" cy="212" r="24" />
            <path d="M66 99h278M66 220h278M656 99h278M656 220h278" />
          </g>
          <g className="project-drawing-ink">
            <circle cx="207" cy="152" r="7" />
            <circle cx="286" cy="112" r="7" />
            <circle cx="795" cy="167" r="7" />
            <circle cx="876" cy="105" r="7" />
            <path d="M344 160h113m86 0h113" />
            <path d="M500 117l43 43-43 43-43-43z" />
          </g>
          <g className="project-drawing-accent project-drawing-trace">
            <path d="M207 152 457 160M286 112 500 117M543 160 795 167M500 117 876 105" />
            <circle cx="500" cy="160" r="5" className="project-drawing-solid" />
          </g>
        </>
      )

    case 'aashan':
      return (
        <>
          <g className="project-drawing-muted">
            <path d="M68 248h864M68 180h864M68 112h864M312 42v240M686 42v240" />
            <rect x="96" y="190" width="28" height="58" />
            <rect x="142" y="160" width="28" height="88" />
            <rect x="188" y="207" width="28" height="41" />
            <rect x="234" y="139" width="28" height="109" />
          </g>
          <g className="project-drawing-ink">
            <path d="M98 138h162M98 151h112" />
            <path d="M359 248V72h279v176" />
            <path d="M375 202 430 190 480 157 531 171 583 105 624 118" />
            <path d="M735 79h144M735 99h98M735 180h144M735 200h117" />
            <circle cx="827" cy="148" r="34" />
          </g>
          <g className="project-drawing-accent project-drawing-trace">
            <path d="M375 202 430 190 480 157 531 171 583 105 624 118" />
            <path d="M813 148l10 10 20-23" />
            <circle cx="583" cy="105" r="5" className="project-drawing-solid" />
          </g>
        </>
      )

    case 'lumira':
      return (
        <>
          <g className="project-drawing-muted">
            <path d="M65 238h870M65 270h870M310 48v224M675 48v224" />
            <path d="M101 238a106 106 0 0 1 212 0" />
            <path d="M128 120l-16-20M206 91V65M285 120l16-20" />
            <path d="M348 237h282M348 211h282M348 185h282M348 159h282M348 133h282" />
          </g>
          <g className="project-drawing-ink">
            <circle cx="206" cy="223" r="37" />
            <path d="M359 217 415 197 470 209 526 152 580 158 624 91" />
            <path d="M724 238v-71h31v71m29 0V123h31v115m29 0V95h31v143" />
          </g>
          <g className="project-drawing-accent project-drawing-trace">
            <path d="M359 217 415 197 470 209 526 152 580 158 624 91" />
            <path d="M717 72h161" />
            <circle cx="624" cy="91" r="5" className="project-drawing-solid" />
          </g>
        </>
      )

    default:
      return (
        <>
          <g className="project-drawing-muted">
            <path d="M70 160h860M316 42v238M684 42v238" />
            <circle cx="163" cy="157" r="49" />
            <circle cx="261" cy="97" r="24" />
            <circle cx="253" cy="227" r="20" />
            <circle cx="755" cy="105" r="22" />
            <circle cx="842" cy="160" r="49" />
            <circle cx="751" cy="223" r="22" />
          </g>
          <g className="project-drawing-ink">
            <path d="M205 132 241 108M205 180l31 36M773 117l29 20M773 211l30-26" />
            <circle cx="500" cy="160" r="87" />
            <circle cx="500" cy="160" r="45" />
            <path d="M413 160h-97M587 160h97M500 73V42M500 247v33" />
            <path d="M473 160h54M500 133v54" />
          </g>
          <g className="project-drawing-accent project-drawing-trace">
            <path d="M316 160h97M587 160h97" />
            <circle cx="500" cy="160" r="6" className="project-drawing-solid" />
          </g>
        </>
      )
  }
}

export default function ProjectDrawing({ project }: { project: Project }) {
  return (
    <figure className="project-drawing">
      <figcaption className="project-drawing-caption readout">
        <span>System sketch / {project.number}</span>
        <span>{project.domain}</span>
      </figcaption>

      <svg viewBox="0 0 1000 320" aria-hidden="true" focusable="false">
        <Drawing slug={project.slug} />
      </svg>

      <ol className="project-drawing-stages readout">
        {project.stages.map((stage, index) => (
          <li key={stage}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {stage}
          </li>
        ))}
      </ol>
    </figure>
  )
}
