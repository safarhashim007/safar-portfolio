import { media, type MediaEntry } from '../data/media'

export type Role = 'art' | 'photo'

export interface Source {
  src: string
  srcSet: string
  width: number
  height: number
  aspect: number
}

/**
 * Builds a srcSet from the widths that actually exist on disk. The generator
 * refuses to upscale, so a 768px original has one entry and the browser is
 * never asked to download a size that was invented.
 */
export function source(role: Role, id: string): Source {
  const entry: MediaEntry | undefined = media[role][id]
  if (!entry) {
    // A referenced id with no derivative is a content bug, not a crash.
    return { src: '', srcSet: '', width: 3, height: 4, aspect: 0.75 }
  }

  const path = (w: number) => `/images/${role}/${id}-${w}.webp`

  return {
    src: path(entry.widths[0]),
    srcSet: entry.widths.map((w) => `${path(w)} ${w}w`).join(', '),
    width: entry.w,
    height: entry.h,
    aspect: entry.w / entry.h,
  }
}

/** Largest derivative — for the viewer dialog only. */
export function full(role: Role, id: string): string {
  const entry = media[role][id]
  if (!entry) return ''
  return `/images/${role}/${id}-${entry.widths[entry.widths.length - 1]}.webp`
}

/** Smallest derivative — for WebGL textures and filmstrips. */
export function thumb(role: Role, id: string): string {
  const entry = media[role][id]
  if (!entry) return ''
  return `/images/${role}/${id}-${entry.widths[0]}.webp`
}

/**
 * The rung `pick` would choose. Split out so the loading screen can look up
 * that file's byte size without parsing the URL it is about to request.
 */
export function rung(role: Role, id: string, target: number): number {
  const entry = media[role][id]
  if (!entry) return 0
  return entry.widths.find((w) => w >= target) ?? entry.widths[entry.widths.length - 1]
}

/**
 * The smallest derivative that is at least `target` wide, or the widest one
 * that exists. Used for WebGL textures, where there is no srcSet to let the
 * browser choose.
 */
export function pick(role: Role, id: string, target: number): string {
  const width = rung(role, id, target)
  return width ? `/images/${role}/${id}-${width}.webp` : ''
}
