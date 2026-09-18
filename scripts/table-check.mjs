/**
 * Is the studio table composed, or just scattered?
 *
 * "Drawings thrown on a surface" is easy to write and easy to get wrong: the
 * failure modes are a drawing half off the table, a drawing buried under
 * another one, and a layout that has quietly turned back into a grid. All
 * three are geometric, so all three are checked here, against the component's
 * own layout function.
 *
 *   node scripts/table-check.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const work = join(tmpdir(), 'safar-portfolio-table')
mkdirSync(work, { recursive: true })
writeFileSync(join(work, 'package.json'), '{"type":"module"}')

execFileSync(
  'node',
  [
    join(root, 'node_modules/typescript/bin/tsc'),
    join(root, 'src/lib/table.ts'),
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
  { cwd: work, stdio: 'inherit' },
)

const { layoutTable } = await import(pathToFileURL(join(work, 'table.js')).href)

// the real artwork proportions
const source = readFileSync(join(root, 'src/data/media.ts'), 'utf8')
const literal = source.slice(source.indexOf('='))
const media = JSON.parse(
  literal.slice(literal.indexOf('{'), literal.lastIndexOf('} as const') + 1),
)

const CROPPED = new Set(['13', '14'])
const aspects = Object.keys(media.art)
  .sort()
  .map((id) => (CROPPED.has(id) ? 9 / 16 : media.art[id].w / media.art[id].h))

const overlap = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

const cases = [
  // A partial final row expands across the width, so its prints are taller.
  { label: 'desktop', compact: false, tableWidth: 1344, viewport: 900, maxScreens: 3.6 * aspects.length / 15 + (aspects.length % 3 ? 0.4 : 0) },
  { label: 'phone', compact: true, tableWidth: 354, viewport: 780, maxScreens: 7 },
]

const failures = []

for (const view of cases) {
  const { items, height } = layoutTable(aspects, view.compact)
  const screens = (height * view.tableWidth) / view.viewport

  let orphans = 0
  let buried = 0
  let worstBuried = 0
  let touching = 0

  items.forEach((item, i) => {
    const above = []
    let neighbours = 0

    items.forEach((other, j) => {
      if (i === j) return
      if (overlap(item, other) <= 0) return
      neighbours += 1
      // only drawings resting on top of this one hide it
      if (other.z > item.z) above.push(other)
    })

    if (!neighbours) orphans += 1
    else touching += 1

    // Sample the drawing's own rectangle: summing overlapping areas
    // double-counts where two drawings cover the same corner, and reported
    // more than 100% of a drawing hidden.
    const N = 40
    let hiddenPoints = 0
    for (let sy = 0; sy < N; sy += 1) {
      for (let sx = 0; sx < N; sx += 1) {
        const px = item.x + ((sx + 0.5) / N) * item.w
        const py = item.y + ((sy + 0.5) / N) * item.h
        if (
          above.some(
            (o) => px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h,
          )
        ) {
          hiddenPoints += 1
        }
      }
    }

    const hidden = hiddenPoints / (N * N)
    worstBuried = Math.max(worstBuried, hidden)
    if (hidden > 0.45) buried += 1
  })

  console.log(
    `${view.label.padEnd(8)} ${items.length} drawings · ${screens.toFixed(1)} screens · ` +
      `${touching}/${items.length} overlap a neighbour · most hidden ${(worstBuried * 100).toFixed(0)}%`,
  )

  // on the table, not off the edge of it
  const off = items.filter((i) => i.x < -0.001 || i.x + i.w > 1.001)
  if (off.length) failures.push(`${view.label}: ${off.length} drawing(s) hang off the table`)

  // a pile, not a grid
  if (orphans > 1) {
    failures.push(`${view.label}: ${orphans} drawings touch nothing — this is a grid, not a table`)
  }

  // nothing lost underneath
  if (buried) {
    failures.push(
      `${view.label}: ${buried} drawing(s) more than 45% covered (worst ${(worstBuried * 100).toFixed(0)}%)`,
    )
  }

  // compact, as asked
  if (screens > view.maxScreens) {
    failures.push(
      `${view.label}: table is ${screens.toFixed(1)} screens (budget ${view.maxScreens})`,
    )
  }

  // The frame must never empty out. This is the failure the previous version
  // of this section had, and a diagonal cascade of prints passes every other
  // check here while leaving half the screen blank.
  const screenH = view.viewport / view.tableWidth // in table-width units
  let thinnest = 1
  for (let step = 0; step <= 40; step += 1) {
    const top = (height - screenH) * (step / 40)
    if (top < 0) break
    const N = 48
    let filled = 0
    for (let sy = 0; sy < N; sy += 1) {
      for (let sx = 0; sx < N; sx += 1) {
        const px = (sx + 0.5) / N
        const py = top + ((sy + 0.5) / N) * screenH
        if (items.some((i) => px >= i.x && px <= i.x + i.w && py >= i.y && py <= i.y + i.h)) {
          filled += 1
        }
      }
    }
    thinnest = Math.min(thinnest, filled / (N * N))
  }
  console.log(`         emptiest screen: ${(thinnest * 100).toFixed(0)}% covered by work`)
  if (thinnest < 0.3) {
    failures.push(
      `${view.label}: only ${(thinnest * 100).toFixed(0)}% of the screen has work on it at some point`,
    )
  }

  // no two drawings in the same place
  const seen = new Set()
  items.forEach((item) => {
    const key = `${item.x.toFixed(3)}:${item.y.toFixed(3)}`
    if (seen.has(key)) failures.push(`${view.label}: two drawings share a position`)
    seen.add(key)
  })
}

if (failures.length) {
  console.error('\nFAILED:')
  failures.forEach((line) => console.error('  ✗ ' + line))
  process.exit(1)
}
console.log('\nthe table is composed: everything on the surface, overlapping, nothing buried')
