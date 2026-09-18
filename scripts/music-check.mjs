/**
 * Does the volume ramp ever ask for a volume the browser will refuse?
 *
 * HTMLMediaElement throws an IndexSizeError for anything outside [0, 1], and
 * it throws it inside a requestAnimationFrame callback, which kills the ramp
 * silently and strands the volume wherever it stopped. The negative-elapsed
 * case is not hypothetical: it is what the frame timestamp does on the first
 * step, and it is why the fade was stuck at zero before the clamp.
 *
 *   node scripts/music-check.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const work = join(tmpdir(), 'safar-portfolio-music')
mkdirSync(work, { recursive: true })
writeFileSync(join(work, 'package.json'), '{"type":"module"}')

execFileSync(
  'node',
  [
    join(root, 'node_modules/typescript/bin/tsc'),
    join(root, 'src/lib/playback.ts'),
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

const { atPageBottom, fadeValue } = await import(pathToFileURL(join(work, 'playback.js')).href)

const TARGET = 0.1
const failures = []
const check = (label, ok) => {
  if (!ok) failures.push(label)
}

// every step of a fade in and a fade out, including the timestamps that
// arrive before the ramp was armed and after it should have finished
for (const [from, to, ms] of [
  [0, TARGET, 1600],
  [TARGET, 0, 700],
  [0.037, TARGET, 1600], // a fade out interrupted mid-flight
]) {
  for (let elapsed = -80; elapsed <= ms + 200; elapsed += 4) {
    const v = fadeValue(from, to, elapsed, ms)
    check(`volume ${v} outside [0,1] at ${elapsed}ms of ${from}->${to}`, v >= 0 && v <= 1)
    check(`volume ${v} above the ceiling at ${elapsed}ms`, v <= TARGET + 1e-9)
  }
}

check('a ramp starts where it was', fadeValue(0, TARGET, 0, 1600) === 0)
check('a ramp lands exactly on target', fadeValue(0, TARGET, 1600, 1600) === TARGET)
check('a ramp stays on target after it ends', fadeValue(0, TARGET, 9000, 1600) === TARGET)
check('a fade out reaches silence', fadeValue(TARGET, 0, 700, 700) === 0)
check(
  'a ramp is gradual, not a step',
  fadeValue(0, TARGET, 800, 1600) > 0.04 && fadeValue(0, TARGET, 800, 1600) < 0.06,
)

// The end of the page has to be reachable: smooth scrolling lands on a
// fractional offset, so an exact test would simply never fire and the sound
// would run past the footer.
const SLACK = 24
const page = 9000
const view = 900
const bottom = page - view // 8100

check('the very bottom counts', atPageBottom(bottom, view, page, SLACK))
check('a fractional bottom counts', atPageBottom(bottom - 0.37, view, page, SLACK))
check('a smooth-scroll undershoot counts', atPageBottom(bottom - SLACK, view, page, SLACK))
check('overscroll counts', atPageBottom(bottom + 60, view, page, SLACK))
check('one screen up does not count', !atPageBottom(bottom - view, view, page, SLACK))
check('the top does not count', !atPageBottom(0, view, page, SLACK))
check('a page shorter than the viewport is already at its end', atPageBottom(0, view, 600, SLACK))

if (failures.length) {
  console.error(`${failures.length} failures:`)
  for (const f of failures.slice(0, 8)) console.error(`  ${f}`)
  process.exit(1)
}
console.log('music: volume ramp stays inside [0, 0.1], and the page bottom is reachable')
