/**
 * The geometry of the archive drum, with no renderer attached.
 *
 * It lives apart from the component for one reason: the claim this hero makes
 * — that the name starts genuinely covered by the work and ends genuinely
 * legible — is a claim about numbers, and numbers can be checked. See
 * scripts/ring-check.mjs, which projects these positions through the same
 * camera and measures how much of the name is actually occluded.
 */

/* How wide a texture the drum asks the image ladder for.
 *
 * These live here rather than in the component because they are a claim about
 * this geometry: a front card is drawn ~366 CSS px wide on a desktop viewport
 * and ~231 on a phone, which at the DPR caps in useDeviceQuality is ~641 and
 * ~312 device pixels. scripts/ring-check.mjs measures both by projecting the
 * card corners below through the real camera, and fails if either target
 * falls under what is drawn. Asking for the largest derivative instead would
 * put 1600px textures on a 366px card. */
export const DESKTOP_TEXTURE = 800
export const COMPACT_TEXTURE = 400

export const MAT_W = 0.7
export const MAT_H = 1.14
export const MAT_ASPECT = MAT_W / MAT_H

export interface RingLayout {
  cols: number
  rows: number
  /** group scale at progress 0 and at progress 1 */
  scale: [number, number]
  x: [number, number]
  y: [number, number]
  /** vertical separation between rows, at progress 0 and 1 */
  spread: [number, number]
  matScale: number
}

export const DESKTOP_LAYOUT: RingLayout = {
  cols: 11,
  rows: 3,
  scale: [1.4, 0.6],
  x: [0, 2.3],
  y: [0, 0.2],
  // Three rows, so letting them apart is what opens bands of the page — and
  // of the name — between them.
  spread: [1, 1.46],
  matScale: 1,
}

export const COMPACT_LAYOUT: RingLayout = {
  cols: 7,
  rows: 3,
  scale: [1.08, 0.62],
  // The drum steps aside on a phone too, rather than lifting.
  //
  // Lifting was tried first and is geometrically self-defeating: with rows
  // stacked about the drum's centre, raising that centre by one row's pitch
  // only swaps which row is in front of the name, so the letters are covered,
  // uncovered and covered again on the way. Moving sideways separates the two
  // objects monotonically, which is the property that matters — and it makes
  // the phone behave like the desktop instead of inventing a second idea.
  x: [0, 0.95],
  y: [0, 0.3],
  spread: [1, 1.25],
  matScale: 1.05,
}

export interface Slot {
  row: number
  angle: number
  art: number
}

export function buildSlots(layout: RingLayout, artworkCount: number): Slot[] {
  const slots: Slot[] = []
  let index = 0
  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.cols; col += 1) {
      // Half-card stagger on alternate rows, so the vertical seams between
      // cards never line up into a window straight through the drum.
      const angle = ((col + (row % 2) * 0.5) / layout.cols) * Math.PI * 2
      slots.push({ row, angle, art: index % artworkCount })
      index += 1
    }
  }
  return slots
}

/** Cards are spaced to just touch, so the closed drum reads as a wall. */
export function ringRadius(layout: RingLayout): number {
  return ((layout.cols * MAT_W * layout.matScale) / (Math.PI * 2)) * 1.02
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export interface RingFrame {
  scale: number
  x: number
  y: number
  rotationX: number
  /** vertical separation multiplier between rows */
  spread: number
}

/**
 * Two overlapping beats. The drum opens first — tilting and letting its rows
 * apart, which is what lets bands of the page through — and only then steps
 * aside. Overlapping them is what stops the sequence reading as two moves.
 */
export function ringFrame(progress: number, layout: RingLayout): RingFrame {
  // The opening starts almost at once and finishes early, so the seams between
  // rows are already letting fragments of the letters through while the drum
  // is still centred. Stepping aside overlaps it and runs long, which is what
  // makes the uncovering gradual instead of a curtain being pulled.
  const open = smoothstep(0.04, 0.52, progress)
  const aside = smoothstep(0.16, 0.94, progress)

  return {
    scale: lerp(layout.scale[0], layout.scale[1], aside),
    x: lerp(layout.x[0], layout.x[1], aside),
    y: lerp(layout.y[0], layout.y[1], aside),
    rotationX: lerp(0.015, -0.155, open),
    spread: lerp(layout.spread[0], layout.spread[1], open),
  }
}

export interface CardPlacement {
  x: number
  y: number
  z: number
  rotationY: number
  /** 0 on the far side of the drum, 1 facing the viewer */
  depth: number
}

/** Local to the group; the group's own transform is applied by the caller. */
export function cardPlacement(
  slot: Slot,
  theta: number,
  frame: RingFrame,
  layout: RingLayout,
  radius: number,
): CardPlacement {
  const angle = slot.angle + theta
  const cos = Math.cos(angle)

  return {
    x: Math.sin(angle) * radius,
    y: (slot.row - (layout.rows - 1) / 2) * MAT_H * layout.matScale * frame.spread,
    z: cos * radius,
    rotationY: angle,
    depth: (cos + 1) / 2,
  }
}


/* ---------------------------------------------------------------------- *
 * Where the name sits, in CSS pixels.
 *
 * Shared with scripts/ring-check.mjs on purpose: if the name's path and the
 * drum's path were written out twice, the occlusion measurement could pass
 * against a model of the hero rather than against the hero.
 * ---------------------------------------------------------------------- */

export interface NameMetrics {
  /** the heading's own unscaled box */
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
  gutter: number
  compact: boolean
}

export interface NameFrame {
  x: number
  y: number
  scale: number
  width: number
  height: number
}

export function nameFrame(progress: number, m: NameMetrics): NameFrame {
  // The name holds still a moment before it starts coming forward, so it does
  // not grow into the drum while the drum is still closed.
  const settle = smoothstep(0.18, 1, progress)
  const scale = lerp(m.compact ? 0.58 : 0.46, 1, settle)

  const width = m.width * scale
  const height = m.height * scale

  const x = lerp((m.viewportWidth - width) / 2, m.gutter, settle)
  // The name stays on the vertical centre line throughout. It was worth
  // trying to settle it lower on a phone, to sit under the lifting drum, but
  // that made it descend into the drum's lower row while the drum was still
  // on its way up: the two motions cancelled and the letters were briefly
  // covered *more* than they had been. Holding the centre keeps the
  // uncovering monotonic, which is the thing that has to be true.
  const y = (m.viewportHeight - height) / 2

  return { x, y, scale, width, height }
}
