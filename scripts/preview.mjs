/**
 * Bakes the server-rendered markup and the real stylesheets into one file that
 * a headless browser can open, with the scroll progress of the hero settable
 * from the query string (?p=0.45).
 *
 * It is a layout harness, not the site: there is no WebGL here, so it proves
 * typography, grid, spacing and responsive behaviour, not the drum. The drum's
 * own claim is checked numerically by ring-check.mjs.
 *
 *   node scripts/smoke.mjs && node scripts/preview.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const work = join(root, '.smoke')
const scratch = join(tmpdir(), 'safar-portfolio-preview')

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

// tokens and base first, then the component sheets, matching import order
const sheets = ['src/styles/tokens.css', 'src/styles/base.css'].map((file) => join(root, file))
const components = walk(join(root, 'src/components'))
  .filter((file) => file.endsWith('.css'))
  .sort()
const css = [...sheets, ...components].map((file) => readFileSync(file, 'utf8')).join('\n\n')

mkdirSync(scratch, { recursive: true })
const markup = readFileSync(join(work, 'render.html'), 'utf8')

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Layout harness — Safar Hashim</title>
<style>${css}</style>
</head>
<body>
${markup}
<script type="module">
  // Reproduce what IdentityHero does each frame, for one fixed progress.
  const { nameFrame } = await import('./ringGeometry.js')
  const { layoutTable } = await import('./table.js')
  const params = new URLSearchParams(location.search)
  const p = Number(params.get('p') ?? 0)
  // ?webgl=1 pretends the renderer is present, so the scroll composition can
  // be inspected even though this harness cannot draw the drum itself.
  if (params.get('webgl') === '1') {
    document.querySelector('.hero')?.classList.remove('hero--still')
    document.querySelector('.hero-still')?.remove()
  }
  const stage = document.querySelector('.hero-stage')
  const name = document.querySelector('.hero-name')
  const anchor = document.querySelector('.hero-anchor')

  // In still mode (no WebGL, or reduced motion) the stylesheet places the
  // name and there is no scroll sequence to simulate.
  const still = document.querySelector('.hero')?.classList.contains('hero--still')

  if (stage && name && !still) {
    stage.style.setProperty('--p', String(p))
    const frame = nameFrame(p, {
      width: name.offsetWidth,
      height: name.offsetHeight,
      gutter: anchor?.offsetLeft ?? 24,
      viewportWidth: window.innerWidth,
      viewportHeight: stage.clientHeight,
      compact: window.matchMedia('(max-width: 900px)').matches,
    })
    name.style.transform =
      'translate3d(' + frame.x + 'px,' + frame.y + 'px,0) scale(' + frame.scale + ')'

    // Stand-in for the drum, so its footprint can be seen in a still.
    const proxy = document.createElement('div')
    proxy.dataset.drumProxy = 'true'
    proxy.textContent = 'ARCHIVE DRUM (WebGL) — footprint only'
    Object.assign(proxy.style, {
      position: 'absolute', inset: '0', zIndex: '3', display: 'grid',
      placeItems: 'center', font: '10px/1 monospace', letterSpacing: '.2em',
      color: 'rgba(22,23,26,.35)', border: '1px dashed rgba(22,23,26,.18)',
      pointerEvents: 'none',
    })
    stage.appendChild(proxy)
  }

  if (still) document.documentElement.dataset.mode = 'still'

  // The studio table sizes itself from its own measured width, and picks a
  // different composition below 700px. Without React running, the harness has
  // to do both — otherwise every narrow screenshot shows the desktop layout
  // squeezed, which is not a thing any visitor would see.
  const table = document.querySelector('.art-table')
  const prints = [...document.querySelectorAll('.art-print')]
  if (table && prints.length) {
    const aspects = prints.map((li) => {
      if (li.querySelector('.art-print-mat--crop')) return 9 / 16
      const img = li.querySelector('img')
      return Number(img.getAttribute('width')) / Number(img.getAttribute('height'))
    })
    const layout = layoutTable(aspects, matchMedia('(max-width: 700px)').matches)
    prints.forEach((li, i) => {
      const place = layout.items[i]
      li.style.setProperty('--x', place.x)
      li.style.setProperty('--y', place.y)
      li.style.setProperty('--w', place.w)
      li.style.setProperty('--rot', place.rot)
      li.style.setProperty('--z', place.z)
      li.querySelector('.art-print-mat').style.aspectRatio = place.w + ' / ' + place.h
    })
    table.style.height = 'calc(var(--tw) * ' + layout.height + ')'
    table.style.setProperty('--tw', table.getBoundingClientRect().width + 'px')
  }

  // Reveal-on-scroll elements are shown, since there is no scrolling here.
  document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-reveal', 'in'))
  document.documentElement.dataset.ready = 'true'
</script>
</body>
</html>
`

writeFileSync(join(work, 'preview.html'), html)

// The harness imports the same geometry the components use. One tsc call per
// file, so the output lands flat beside preview.html rather than mirroring the
// source tree.
for (const file of ['src/webgl/ringGeometry.ts', 'src/lib/table.ts']) {
  execFileSync(
    'node',
    [
      join(root, 'node_modules/typescript/bin/tsc'),
      join(root, file),
      '--outDir',
      work,
      '--module',
      'esnext',
      '--target',
      'es2022',
      '--moduleResolution',
      'bundler',
      '--ignoreConfig',
    ],
    { cwd: scratch, stdio: 'inherit' },
  )
}

console.log('wrote .smoke/preview.html (' + Math.round(html.length / 1024) + ' kB inline)')
