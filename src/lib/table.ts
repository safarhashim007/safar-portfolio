/**
 * Drawings laid out on a table.
 *
 * Every measurement here is a fraction of the table's own width, so one CSS
 * custom property (`--tw`, the measured width) scales the whole composition and
 * nothing has to be re-laid-out on resize.
 *
 * The positions are *composed*, not random. Scattering by jitter alone is what
 * reads as accidental — and worse, it cannot be checked. Here the drawings go
 * down in rows that span the full width, and the row is then broken up: each
 * column sits at its own depth on the surface, alternate rows shift sideways,
 * and every print has its own angle. Rows overlap the row above, which is what
 * makes it a pile rather than a grid.
 *
 * The numbers are verified by scripts/table-check.mjs, which asserts that every
 * drawing sits on the table, overlaps a neighbour, is never mostly buried, and
 * — the one that matters most — that the frame never empties out as you scroll
 * past. A cascade of single prints down a diagonal passes the first three and
 * still leaves half the screen blank.
 */

export interface Column {
  /** left edge, fraction of table width */
  x: number
  /** width, fraction of table width */
  w: number
  /** how far down the row this column sits, fraction of table width */
  drop: number
}

export const WIDE_COLUMNS: Column[] = [
  { x: 0.0, w: 0.3, drop: 0.0 },
  { x: 0.345, w: 0.3, drop: 0.075 },
  { x: 0.69, w: 0.3, drop: 0.03 },
]

export const NARROW_COLUMNS: Column[] = [
  { x: 0.0, w: 0.56, drop: 0.0 },
  { x: 0.42, w: 0.56, drop: 0.12 },
]

/** Vertical advance per row, fraction of table width. Smaller than a print is
 *  tall, so each row rests on the one above it. */
export const WIDE_ROW_STEP = 0.4
export const NARROW_ROW_STEP = 0.86

/** Sideways nudge per row, so columns never line up into a grid. */
const ROW_SHIFT = [0, 0.035, -0.022, 0.014, -0.03]
/** Resting angles, cycled so no two neighbours lean the same way. */
const ANGLES = [-3.1, 2.4, -1.6, 3.3, -2.2, 1.8, -2.7, 2.9]

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export interface Placed {
  x: number
  y: number
  w: number
  h: number
  rot: number
  /** later drawings rest on top of earlier ones, as a pile does */
  z: number
}

export interface TableLayout {
  items: Placed[]
  /** total height, fraction of table width */
  height: number
}

/**
 * @param aspects width / height of each drawing, in source order
 */
export function layoutTable(aspects: number[], compact = false): TableLayout {
  const columns = compact ? NARROW_COLUMNS : WIDE_COLUMNS
  const rowStep = compact ? NARROW_ROW_STEP : WIDE_ROW_STEP

  const items = aspects.map((aspect, index) => {
    const row = Math.floor(index / columns.length)
    const column = columns[index % columns.length]
    const shift = ROW_SHIFT[row % ROW_SHIFT.length]
    // alternate rows hang the other way, so the drops do not stripe
    const drop = row % 2 === 0 ? column.drop : column.drop * -0.6

    const remainder = aspects.length % columns.length
    const partialLastRow = !compact && remainder > 0 && row === Math.floor(aspects.length / columns.length)
    const w = partialLastRow ? (0.96 / remainder) : column.w
    return {
      x: partialLastRow ? 0.004 + (index % columns.length) * (0.992 - w) / Math.max(1, remainder - 1) : clamp(column.x + shift, 0.004, 0.996 - w),
      y: row * rowStep + drop + rowStep * 0.4 + (partialLastRow ? 0.1 : 0),
      w,
      h: w / aspect,
      rot: ANGLES[index % ANGLES.length],
      z: index + 1,
    }
  })

  const top = Math.min(...items.map((item) => item.y))
  items.forEach((item) => {
    item.y -= top
  })

  return {
    items,
    height: items.reduce((tallest, item) => Math.max(tallest, item.y + item.h), 0),
  }
}
