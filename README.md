# Safar Hashim — portfolio

AI and machine learning, software, drawing and photography, in one site.

## The idea

Safar's work is about **correspondence**: CHANDRA matches two photographs of
the same patch of the Moon taken under different light; a drawing is a
correspondence to what he saw; a photograph is one he kept; a model is one it
learned. So the site has one motion idea — things coming *into register* — and
one accent colour that means exactly that and nothing else.

The hero is the argument. `SAFAR HASHIM` is real, selectable HTML sitting
behind a transparent canvas; in front of it is a drum built from his own
artwork, with genuine depth, so at the top of the page the letters are
physically covered and only the seams between prints let fragments through.
Scrolling turns, opens and finally stands the drum aside. **The heading's
opacity never changes** — it becomes legible because the geometry moved. The
identity is recovered from the work rather than announced over it.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
npm run check      # markup, geometry, audio and theme checks
npm run media      # re-derive public/images from assets-src/
```

## Images

`assets-src/` holds the originals and is never shipped. `npm run media`
derives every size in `public/images/` and writes the intrinsic dimensions to
`src/data/media.ts`, which is what gives every `<img>` a `width`/`height` and
every `srcSet` only the sizes that actually exist. Nothing is ever upscaled.

A handful of source files were saved without EXIF orientation but with the
rotation still in the pixels; `ROTATIONS` in `scripts/build-media.py` corrects
those. Add to it rather than rotating a file by hand.

## Verification

`npm run check` verifies markup, geometry, audio and theme behavior beyond the type checker.

- **`scripts/smoke.mjs`** renders the whole component tree with
  `react-dom/server` and asserts the markup: one `h1`, every class used is
  actually styled (a `visually-hidden` class that no stylesheet defined is how
  a hidden headline once rendered at display size), every image has alt text
  and intrinsic size, disclosures expose their state, Aashan says
  `IN DEVELOPMENT`, exactly two artworks are cropped.
- **`scripts/ring-check.mjs`** projects the hero drum's real card positions
  through the same camera the canvas uses and measures how much of the name is
  occluded, at eight scroll positions and seven drum rotations. It asserts the
  name starts ≥80% hidden, ends fully clear, shows fragments on the way, and
  never becomes *less* legible once it has begun to appear.
- **`scripts/gallery-check.mjs`** verifies that all drawings remain reachable
  through repeated loops, visible cards never jump at the wrap, and reduced
  motion produces a flat gallery. Check dragging, clicking, keyboard navigation
  and vertical scrolling in the browser when changing the gallery interaction.
- **`scripts/music-check.mjs`** checks volume limits and page reachability.
- **`scripts/theme-check.mjs`** checks contrast on both grounds.

`scripts/preview.mjs` bakes the server-rendered markup and the real
stylesheets into `.smoke/preview.html`, with `?p=` and `?webgl=1` to inspect a
given moment of the hero sequence in a browser. It is a layout harness, not
the site: it cannot draw WebGL, and it applies a still gallery layout itself
because React is not running.

Because the checks share the components' own geometry (`src/webgl/ringGeometry.ts`,
`src/lib/gallery.ts`) rather than a copy of it, they cannot quietly pass against a
model of the page instead of the page.

## Shape

```
src/
  styles/        tokens.css — one ground, one inversion, one accent, one easing
  hooks/         scroll progress, pointer drag, device quality, reduced motion
  lib/           image sources, the drawing gallery's curved layout
  webgl/         one canvas: the hero drum
    shaders/     the drum's shader, each effect with a stated reason
  components/    one file each, with its own stylesheet beside it
  data/          artworks, photos, projects, and generated media.ts
```

One WebGL context in the whole site — the hero drum — stopped when it scrolls
out of view and loaded lazily so the document and the name paint first. The
photography moves with scrolling; the drawing gallery stays pinned while vertical
scrolling advances through all 20 works, then releases into photography. Horizontal
dragging and keyboard navigation stay synchronized with that scroll position.
Its CSS transform frame loop stops when settled.
Everything readable is HTML, and the site works with no WebGL at all.
