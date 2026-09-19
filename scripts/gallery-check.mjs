import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const work = join(tmpdir(), 'safar-portfolio-gallery')
mkdirSync(work, { recursive: true })
writeFileSync(join(work, 'package.json'), '{"type":"module"}')
execFileSync('node', [join(root, 'node_modules/typescript/bin/tsc'),
  join(root, 'src/lib/gallery.ts'), '--outDir', work, '--module', 'esnext',
  '--target', 'es2022', '--moduleResolution', 'bundler', '--ignoreConfig'], { cwd: work, stdio: 'inherit' })
const { galleryPose, wrapGalleryIndex } = await import(pathToFileURL(join(work, 'gallery.js')))

for (const step of [210, 280, 360]) {
  for (let position = -60; position <= 60; position += 1) {
    const selected = wrapGalleryIndex(position, 20)
    assert.equal(galleryPose(selected, position, 20, step).x, 0, 'selected drawing must be centered after any number of loops')
    const poses = Array.from({ length: 20 }, (_, i) => galleryPose(i, position, 20, step))
    assert.equal(new Set(poses.map(p => p.x)).size, 20, 'drawings must occupy distinct slots')
    for (let i = 0; i < 20; i += 1) {
      assert.deepEqual(galleryPose(i, position, 20, step), galleryPose(i, position + 20, 20, step), 'each full loop must be seamless')
      const a = galleryPose(i, position, 20, step)
      const b = galleryPose(i, position + 0.1, 20, step)
      if (Math.abs(a.offset) < 5) assert.ok(Math.abs(b.x - a.x + step * 0.1) < 0.0001, 'visible drawings must not jump during wrap')
      const still = galleryPose(i, position, 20, step, true)
      assert.ok(still.y === 0 && still.z === 0 && still.rotateY === 0 && still.rotateZ === 0, 'reduced motion must remove curvature')
    }
  }
}
console.log('gallery: all 20 drawings reachable, seamless loops, stable visible cards, reduced-motion layout verified')
