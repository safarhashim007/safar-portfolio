/**
 * Render the whole component tree with react-dom/server and assert the things
 * that must be true of the markup.
 *
 * This is the check that would have caught the two worst defects in the
 * previous version: a `visually-hidden` class that no stylesheet defined (so a
 * "hidden" headline was rendering at display size), and animation selectors
 * pointing at elements that no longer existed.
 *
 *   node scripts/smoke.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
/** Compile scratch goes to the temp dir, not into the repository. */
const work = join(tmpdir(), 'safar-portfolio-smoke')
/** What the run leaves behind for a human to look at. */
const out = join(root, '.smoke')

// ---- 1. compile a copy of src with the stylesheet imports removed ---------
// Best-effort: tsc overwrites its own output, so a scratch dir that cannot be
// removed (a read-only or otherwise restricted mount) is not a reason to fail.
try {
  execFileSync('rm', ['-rf', work], { stdio: 'ignore' })
} catch {
  /* keep going */
}
mkdirSync(join(work, 'src'), { recursive: true })
mkdirSync(out, { recursive: true })
// react and react-dom are resolved from the project, not from the temp dir
if (!existsSync(join(work, 'node_modules'))) {
  symlinkSync(join(root, 'node_modules'), join(work, 'node_modules'), 'dir')
}
if (!existsSync(join(work, 'package.json'))) {
  writeFileSync(join(work, 'package.json'), '{"type":"module"}')
}
// `src/.` rather than `src`: copying a directory *onto* an existing directory
// of the same name nests it, and the compile then runs against last run's
// copy. That silently tested stale code once already.
execFileSync('cp', ['-R', join(root, 'src') + '/.', join(work, 'src')])

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

// If the scratch copy could not be cleared, make sure it did not keep a file
// that no longer exists in src — compiling those would test code that is gone.
const live = new Set(walk(join(root, 'src')).map((file) => relative(join(root, 'src'), file)))
const stale = walk(join(work, 'src'))
  .map((file) => relative(join(work, 'src'), file))
  .filter((file) => !live.has(file))
if (stale.length) {
  console.error('stale files in the scratch copy — remove .smoke and re-run:')
  stale.forEach((file) => console.error('  ' + file))
  process.exit(1)
}

for (const file of walk(join(work, 'src'))) {
  if (!/\.tsx?$/.test(file)) continue
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace(/^\s*import\s+['"][^'"]+\.css['"]\s*;?\s*$/gm, ''),
  )
}

writeFileSync(
  join(work, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'es2023',
        lib: ['ES2023', 'DOM'],
        module: 'esnext',
        moduleResolution: 'bundler',
        // the real type check is `tsc -b`; this copy only has to run
        noImplicitAny: false,
        jsx: 'react-jsx',
        skipLibCheck: true,
        resolveJsonModule: true,
        outDir: 'out',
        rootDir: 'src',
      },
      include: ['src'],
    },
    null,
    2,
  ),
)

execFileSync('node', [join(root, 'node_modules/typescript/bin/tsc'), '-p', work], {
  cwd: root,
  stdio: 'inherit',
})

// Bundler-style imports have no extension; node needs one to load them.
for (const file of walk(join(work, 'out'))) {
  if (!file.endsWith('.js')) continue
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace(
      /(from\s+['"])(\.[^'"]*?)(['"])/g,
      (whole, head, path, tail) => (/\.[a-z]+$/.test(path) ? whole : `${head}${path}.js${tail}`),
    ),
  )
}

// ---- 2. render ------------------------------------------------------------
const { renderToStaticMarkup } = await import('react-dom/server')
const { createElement } = await import('react')
const { default: App } = await import(pathToFileURL(join(work, 'out/App.js')).href)

const html = renderToStaticMarkup(createElement(App))
writeFileSync(join(out, 'render.html'), html)

// ---- 3. assert -----------------------------------------------------------
const css = walk(join(root, 'src'))
  .filter((file) => file.endsWith('.css'))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

// structure
check('exactly one h1', (html.match(/<h1/g) ?? []).length === 1)
check('h1 carries the name', /<h1[^>]*>[\s\S]*?Safar[\s\S]*?Hashim/.test(html))
check('no "artwork archive" headline', !/artwork archive/i.test(html))
check('sections present', ['projects', 'art', 'photography', 'about', 'contact'].every((id) => html.includes(`id="${id}"`)))
check('hero is the first landmark', html.indexOf('id="home"') < html.indexOf('id="projects"'))

// every class the markup uses must exist in a stylesheet — this is the
// visually-hidden defect, generalised
const used = new Set()
for (const match of html.matchAll(/class="([^"]+)"/g)) {
  match[1].split(/\s+/).forEach((name) => name && used.add(name))
}
const missing = [...used].filter((name) => !css.includes(`.${name}`))
check(`every class is styled (missing: ${missing.join(', ')})`, missing.length === 0)

// accessibility
const images = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
check('every image has alt', images.every((tag) => /\balt="/.test(tag)))
check('every image has intrinsic size or aspect', images.every((tag) => /width="/.test(tag) || /aspect-ratio/.test(tag)))
check('disclosures expose state', (html.match(/aria-expanded=/g) ?? []).length >= 5)
check('collapsed panels are inert', html.includes('inert=""') || /inert(=""|>)/.test(html))
check('skip link present', html.includes('skip-link'))
check('no clickable divs', !/<div[^>]*onclick/i.test(html))

// content promises
check('Aashan is marked in development', /AASHAN[\s\S]{0,2000}IN DEVELOPMENT/.test(html))
check('every project row states a status', (html.match(/work-status/g) ?? []).length >= 4)
check('archive rows do not link the whole row', !/<a[^>]*class="[^"]*work-archive-row/.test(html))
check('no portrait section headline', !/<h[1-6][^>]*>[^<]*portrait/i.test(html))

// the two artworks that were asked to be cropped, and only those
check('exactly two cropped works', (html.match(/art-print-mat--crop/g) ?? []).length === 2)

// Every derivative the markup asks for must exist. A missing size is a
// section that silently does not load.
const referenced = new Set()
for (const match of html.matchAll(/\/images\/(art|photo)\/[\w-]+\.webp/g)) referenced.add(match[0])
const absent = [...referenced].filter((path) => !existsSync(join(root, 'public', path)))
check(`every image path exists (missing: ${absent.join(', ')})`, absent.length === 0)

// No photograph may be hidden in favour of something that might not draw.
// Coordinating an <img> away behind a WebGL plane once left the gallery as a
// column of empty boxes, because the frame behind the image is opaque and
// stacked above the canvas.
check('no image is hidden by an inline style', !/<img[^>]*style="[^"]*opacity:\s*0/.test(html))

// Every photograph is uncovered by the same mask, and the mask is what the
// reveal observer drives — a frame without the hook never uncovers at all.
const frames = [...html.matchAll(/<div class="photo-frame"[^>]*>/g)].map((m) => m[0])
const countEntries = (file) =>
  (readFileSync(join(root, 'src/data', file), 'utf8').match(/^\s*\{ id: '/gm) ?? []).length
const photoCount = countEntries('photos.ts')
const artCount = countEntries('artworks.ts')
check(
  `every photo frame reveals (${frames.length}/${photoCount})`,
  frames.length === photoCount && frames.every((tag) => /data-reveal/.test(tag)),
)

// All original drawings remain available in the carousel and full-size viewer.
const prints = [...html.matchAll(/<li class="art-print"[^>]*>/g)].map((m) => m[0])
check(
  'every drawing is present',
  prints.length === artCount,
)
check('gallery supports keyboard discovery', /class="art-carousel"[^>]*tabindex="0"/.test(html) && html.includes('id="art-instructions"'))
check('every drawing can open', (html.match(/aria-label="Open drawing /g) ?? []).length === artCount)
check('gallery announces the selected drawing', html.includes('aria-live="polite"') && html.includes('Selected drawing'))

console.log(`rendered ${html.length} bytes of markup, ${images.length} images`)
if (failures.length) {
  console.error('\nFAILED:')
  failures.forEach((line) => console.error('  ✗ ' + line))
  process.exit(1)
}
console.log('all checks passed')
console.log('markup written to ' + relative(root, join(out, 'render.html')))
