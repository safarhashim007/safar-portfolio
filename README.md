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
npm run check      # the three verification scripts below
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

`npm run check` runs three scripts. They exist because the three things most
likely to break here are not things a type checker can see.

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
- **`scripts/table-check.mjs`** lays out Drawn by Hand at both compositions and
  asserts that every drawing sits on the table, overlaps a neighbour so the
  surface reads as a pile rather than a grid, is never mostly buried, and —
  the one that matters most — that the frame never empties out as you scroll
  past it.

`scripts/preview.mjs` bakes the server-rendered markup and the real
stylesheets into `.smoke/preview.html`, with `?p=` and `?webgl=1` to inspect a
given moment of the hero sequence in a browser. It is a layout harness, not
the site: it cannot draw WebGL, and it reapplies the table layout itself
because React is not running.

Because the checks share the components' own geometry (`src/webgl/ringGeometry.ts`,
`src/lib/table.ts`) rather than a copy of it, they cannot quietly pass against a
model of the page instead of the page.

## Shape

```
src/
  styles/        tokens.css — one ground, one inversion, one accent, one easing
  hooks/         scroll progress, pointer drag, device quality, reduced motion
  lib/           image sources, the studio table's composition
  webgl/         one canvas: the hero drum
    shaders/     the drum's shader, each effect with a stated reason
  components/    one file each, with its own stylesheet beside it
  data/          artworks, photos, projects, and generated media.ts
```

One WebGL context in the whole site — the hero drum — stopped when it scrolls
out of view and loaded lazily so the document and the name paint first. The
photography and the drawings move in CSS, driven by one scroll-velocity hook.
Everything readable is HTML, and the site works with no WebGL at all.
