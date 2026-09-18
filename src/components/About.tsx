import './about.css'

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
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <header className="about-head">
        <span className="readout">04 / About</span>
        <h2 className="h2" id="about-title" data-reveal>
          About
        </h2>
        <p className="readout about-head-count">Kochi, India · 2026</p>
      </header>

      <p className="about-statement" data-reveal>
        I'm Safar — an AI and machine learning student who also draws and
        photographs. The same habit runs through all of it: take two views of
        the same thing and work out how they line up.
      </p>

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
