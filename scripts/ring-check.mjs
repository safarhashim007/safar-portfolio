/**
 * Does the archive actually hide the name, and does it actually let it go?
 *
 * The hero's whole claim is geometric: at the top of the page the drum of
 * artwork physically covers SAFAR HASHIM, and by the end it does not. That is
 * measurable, so it is measured — the real card placements from
 * src/webgl/ringGeometry.ts are projected through the same camera the canvas
 * uses, and the share of the name's box that ends up behind a card is
 * counted.
 *
 *   node scripts/ring-check.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const work = join(tmpdir(), 'safar-portfolio-ring')

// Best-effort: tsc overwrites its own output, so a scratch dir that cannot be
// removed (a read-only or otherwise restricted mount) is not a reason to fail.
try {
  execFileSync('rm', ['-rf', work], { stdio: 'ignore' })
} catch {
  /* keep going */
}
mkdirSync(work, { recursive: true })
// cwd is the scratch dir so tsc does not try to pick up the project's own
// tsconfig while compiling a single file
execFileSync(
  'node',
  [
    join(root, 'node_modules/typescript/bin/tsc'),
    join(root, 'src/webgl/ringGeometry.ts'),
    join(root, 'src/lib/image.ts'),
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
writeFileSync(join(work, 'package.json'), '{"type":"module"}')

const geometry = await import(pathToFileURL(join(work, 'webgl/ringGeometry.js')).href)
const {
  DESKTOP_LAYOUT,
  COMPACT_LAYOUT,
  COMPACT_TEXTURE,
  DESKTOP_TEXTURE,
  MAT_H,
  MAT_W,
  buildSlots,
  cardPlacement,
  nameFrame,
  ringFrame,
  ringRadius,
} = geometry

// ---- the same camera the canvas is created with ---------------------------
const FOV = 32
const CAMERA_Z = 6

function projector(width, height) {
  const halfHeight = Math.tan((FOV * Math.PI) / 360)
  const aspect = width / height
  return ([x, y, z]) => {
    const depth = CAMERA_Z - z
    if (depth <= 0.05) return null // behind or on the lens
    const ndcX = x / (depth * halfHeight * aspect)
    const ndcY = y / (depth * halfHeight)
    return [((ndcX + 1) / 2) * width, ((1 - ndcY) / 2) * height, depth]
  }
}

/** The card's four corners in world space, after the group transform. */
function corners(card, frame, layout) {
  const w = (MAT_W * layout.matScale) / 2
  const h = (MAT_H * layout.matScale) / 2
  const cos = Math.cos(card.rotationY)
  const sin = Math.sin(card.rotationY)
  const tilt = frame.rotationX

  return [
    [-w, -h],
    [w, -h],
    [w, h],
    [-w, h],
  ].map(([lx, ly]) => {
    // rotate about Y, then translate into the ring
    let x = card.x + lx * cos
    let y = card.y + ly
    let z = card.z - lx * sin
    // the group's tilt about X
    const ty = y * Math.cos(tilt) - z * Math.sin(tilt)
    const tz = y * Math.sin(tilt) + z * Math.cos(tilt)
    y = ty
    z = tz
    // the group's scale and offset
    return [x * frame.scale + frame.x, y * frame.scale + frame.y, z * frame.scale]
  })
}

function inside(polygon, px, py) {
  let hit = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/**
 * Share of the name's box hidden behind a card, sampled on a grid.
 * `nameBox` is in CSS pixels, matching what IdentityHero computes.
 */
function occlusion({ layout, progress, theta, width, height, nameBox, samples = 90 }) {
  const slots = buildSlots(layout, 20)
  const radius = ringRadius(layout)
  const frame = ringFrame(progress, layout)
  const project = projector(width, height)

  const quads = slots
    .map((slot) => {
      const card = cardPlacement(slot, theta, frame, layout, radius)
      if (card.z < -0.15 * radius) return null // back of the drum, not drawn
      const points = corners(card, frame, layout).map(project)
      return points.some((point) => point === null) ? null : points
    })
    .filter(Boolean)

  let covered = 0
  let total = 0
  for (let iy = 0; iy < samples; iy += 1) {
    for (let ix = 0; ix < samples; ix += 1) {
      const px = nameBox.x + ((ix + 0.5) / samples) * nameBox.width
      const py = nameBox.y + ((iy + 0.5) / samples) * nameBox.height
      total += 1
      if (quads.some((quad) => inside(quad, px, py))) covered += 1
    }
  }
  return covered / total
}

const cases = [
  {
    label: 'desktop 1440×900',
    layout: DESKTOP_LAYOUT,
    view: {
      width: 1440,
      height: 900,
      metrics: {
        width: 900,
        height: 260,
        viewportWidth: 1440,
        viewportHeight: 900,
        gutter: 48,
        compact: false,
      },
    },
  },
  {
    label: 'phone 390×780',
    layout: COMPACT_LAYOUT,
    view: {
      width: 390,
      height: 780,
      metrics: {
        // two stacked lines of the display size at 390px wide
        width: 210,
        height: 95,
        viewportWidth: 390,
        viewportHeight: 780,
        gutter: 18,
        compact: true,
      },
    },
  },
]

// Several drum rotations, because the answer must not depend on where the
// archive happens to have turned to.
const thetas = [0, 0.37, 0.94, 1.7, 2.6, 3.4, 4.9]
const stops = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]

const failures = []
for (const testCase of cases) {
  console.log(`\n${testCase.label}`)
  const series = stops.map((progress) => {
    const values = thetas.map((theta) =>
      occlusion({
        layout: testCase.layout,
        progress,
        theta,
        width: testCase.view.width,
        height: testCase.view.height,
        nameBox: nameFrame(progress, testCase.view.metrics),
      }),
    )
    const min = Math.min(...values)
    const max = Math.max(...values)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    console.log(
      `  p=${progress.toFixed(1)}  hidden ${(mean * 100).toFixed(1)}%  (${(min * 100).toFixed(1)}–${(max * 100).toFixed(1)}% across rotations)`,
    )
    return { progress, min, max, mean }
  })

  const first = series[0]
  const last = series[series.length - 1]

  // 1. the name really is covered at the start, whatever the rotation
  if (first.min < 0.8) {
    failures.push(`${testCase.label}: name only ${(first.min * 100).toFixed(1)}% hidden at p=0 (want ≥80%)`)
  }
  // 2. and it really is clear at the end
  if (last.max > 0.02) {
    failures.push(`${testCase.label}: name still ${(last.max * 100).toFixed(1)}% hidden at p=1 (want ≤2%)`)
  }
  // 3. once the letters have begun to emerge they are never covered back up.
  //    While the drum is still closed the name is also still growing, so the
  //    covered share can wobble a point or two either way at ~90% hidden;
  //    that is not something an eye can see. What must never happen is the
  //    name becoming *less* legible after it has started to appear.
  let emerging = false
  for (let i = 1; i < series.length; i += 1) {
    if (series[i - 1].mean < 0.8) emerging = true
    if (!emerging) continue
    if (series[i].mean > series[i - 1].mean + 0.02) {
      failures.push(
        `${testCase.label}: occlusion rises from ${(series[i - 1].mean * 100).toFixed(1)}% to ${(series[i].mean * 100).toFixed(1)}% between p=${series[i - 1].progress} and p=${series[i].progress}`,
      )
    }
  }
  // 4. fragments, not a blank: by the time the drum has begun to open, some of
  //    the letters must be showing through the seams between cards
  const early = series.find((entry) => entry.progress > 0.15 && entry.progress <= 0.45)
  if (early && early.min > 0.98) {
    failures.push(
      `${testCase.label}: no fragments visible by p=${early.progress} (${(early.min * 100).toFixed(1)}% hidden)`,
    )
  }
}

// ---- resolution -----------------------------------------------------------
//
// A card is a photograph of a drawing, and a drawing drawn into more pixels
// than its texture has is a blur. How wide a card is actually drawn is not a
// guess: it is the same projection used above, applied to the card's own
// corners. Measure the widest a card is ever drawn, turn that into device
// pixels at the DPR cap, and check that the drum is never asking the ladder
// for a rung narrower than that while a wider one exists on disk.

// tsc leaves import specifiers exactly as written, and node needs the
// extension it does not have.
const emitted = join(work, 'lib/image.js')
writeFileSync(emitted, readFileSync(emitted, 'utf8').replace("'../data/media'", "'../data/media.js'"))
const image = await import(pathToFileURL(emitted).href)

{
  const media = JSON.parse(
    (() => {
      const source = readFileSync(join(root, 'src/data/media.ts'), 'utf8')
      const literal = source.slice(source.indexOf('='))
      return literal.slice(literal.indexOf('{'), literal.lastIndexOf('} as const') + 1)
    })(),
  )

  /** The widest a single card is ever drawn, in CSS pixels. */
  function widestCard({ layout, width, height }) {
    const slots = buildSlots(layout, 20)
    const radius = ringRadius(layout)
    let widest = 0

    for (let step = 0; step <= 20; step += 1) {
      const progress = step / 20
      const frame = ringFrame(progress, layout)
      const project = projector(width, height)
      for (let turn = 0; turn < 8; turn += 1) {
        const theta = (turn / 8) * Math.PI * 2
        for (const slot of slots) {
          const card = cardPlacement(slot, theta, frame, layout, radius)
          const points = corners(card, frame, layout).map(project)
          if (points.some((point) => point === null)) continue
          // the card's own horizontal edge, bottom-left to bottom-right
          const [a, b] = [points[0], points[1]]
          widest = Math.max(widest, Math.hypot(b[0] - a[0], b[1] - a[1]))
        }
      }
    }
    return widest
  }

  const CASES = [
    { label: 'desktop', layout: DESKTOP_LAYOUT, width: 1440, height: 900, dpr: 1.75, target: DESKTOP_TEXTURE },
    { label: 'compact', layout: COMPACT_LAYOUT, width: 390, height: 844, dpr: 1.35, target: COMPACT_TEXTURE },
  ]

  for (const testCase of CASES) {
    const css = widestCard(testCase)
    const needed = css * testCase.dpr
    console.log(
      `${testCase.label}: widest card ${css.toFixed(0)} css px, ${needed.toFixed(0)} device px at dpr ${testCase.dpr}; asking for ${testCase.target}px textures`,
    )

    if (testCase.target < needed) {
      failures.push(
        `${testCase.label}: asks for ${testCase.target}px textures but draws cards ${needed.toFixed(0)} device px wide`,
      )
    }

    const limited = []
    for (const id of Object.keys(media.art)) {
      const widths = media.art[id].widths
      const chosen = Number(image.pick('art', id, testCase.target).match(/-(\d+)\.webp$/)[1])
      const best = widths[widths.length - 1]
      if (chosen < testCase.target && chosen !== best) {
        failures.push(
          `${testCase.label}: art ${id} loads ${chosen}px when ${best}px exists`,
        )
      }
      if (best < needed) limited.push(`${id} (${best}px)`)
    }
    if (limited.length) {
      console.log(`  master-limited, nothing to be done in code: ${limited.join(', ')}`)
    }
  }
}

if (failures.length) {
  console.error('\nFAILED:')
  failures.forEach((line) => console.error('  ✗ ' + line))
  process.exit(1)
}
console.log('\nreveal sequence holds at every rotation tested, and no card is drawn from an avoidable upscale')
