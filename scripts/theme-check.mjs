/**
 * Is the site legible both ways up?
 *
 * Dark mode here is not a second palette but the same two families traded,
 * so the failure mode is not "it looks wrong" — it is one pair that quietly
 * drops below readable while the other eleven stay fine. Every semantic pair
 * is resolved the way the cascade resolves it, on both grounds, in both
 * modes, and measured.
 *
 *   node scripts/theme-check.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8')

const block = (selector) => {
  const at = css.indexOf(selector + ' {')
  if (at < 0) throw new Error(`no ${selector} block in tokens.css`)
  const body = css.slice(at + selector.length + 2, css.indexOf('}', at))
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
  )
}

// var(--x) chains resolve against the declarations already in force
const resolve = (value, scope, seen = 0) => {
  const ref = /^var\((--[\w-]+)\)$/.exec(value)
  if (!ref) return value
  if (seen > 8) throw new Error(`cycle resolving ${value}`)
  return resolve(scope[ref[1]] ?? '', scope, seen + 1)
}

const channel = (v) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (hex) => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const light = block(':root')
const dark = { ...light, ...block(":root[data-theme='dark']") }
const inversion = block('.on-dark')

const ground = (scope) => {
  const flipped = { ...scope }
  for (const [key, value] of Object.entries(inversion)) flipped[key] = resolve(value, scope)
  return { page: scope, inverted: flipped }
}

/* foreground, background, floor — the floor is the job the token does:
   body text, metadata, ticks that must merely be seen, a hairline. */
const PAIRS = [
  ['--ink', '--paper', 7],
  ['--ink-soft', '--paper', 4.5],
  ['--ink-faint', '--paper', 2.5],
  ['--reg', '--paper', 4.5],
  ['--rule', '--paper', 1.25],
  ['--paper-sunk', '--paper', 1.02],
  ['--paper-raised', '--paper', 1.02],
]

const failures = []
const rows = []

for (const [mode, scope] of [['light', light], ['dark', dark]]) {
  for (const [side, tokens] of Object.entries(ground(scope))) {
    for (const [fg, bg, floor] of PAIRS) {
      const a = resolve(tokens[fg], tokens)
      const b = resolve(tokens[bg], tokens)
      if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) {
        failures.push(`${mode}/${side}: ${fg} or ${bg} did not resolve to a colour (${a} on ${b})`)
        continue
      }
      const ratio = contrast(a, b)
      rows.push(`${mode.padEnd(5)} ${side.padEnd(8)} ${fg.padEnd(14)} on ${bg.padEnd(14)} ${ratio.toFixed(2)}:1`)
      if (ratio < floor) {
        failures.push(`${mode}/${side}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, under ${floor}:1`)
      }
    }
  }
}

// the accent must stay one hue with two ground-appropriate values, not drift
for (const [mode, scope] of [['light', light], ['dark', dark]]) {
  const onPage = resolve(scope['--reg'], scope)
  const onInverted = resolve(ground(scope).inverted['--reg'], scope)
  if (onPage === onInverted) failures.push(`${mode}: the accent does not change with the ground`)
}

console.log(rows.join('\n'))

if (failures.length) {
  console.error(`\n${failures.length} failures:`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}
console.log('\ntheme: every pair stays legible on both grounds, both ways up')
