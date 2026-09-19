export const wrapGalleryIndex = (value: number, count: number) => ((value % count) + count) % count

/** Wrap at the back of the loop, beyond the visible arc, so no visible card jumps. */
export function galleryPose(index: number, position: number, count: number, step: number, reduced = false) {
  const offset = wrapGalleryIndex(index - position + count / 2, count) - count / 2
  const bend = reduced ? 0 : Math.min(offset * offset, 12)
  return {
    offset,
    x: offset * step,
    y: bend * 7,
    z: -bend * 26,
    rotateY: reduced ? 0 : Math.max(-35, Math.min(35, -offset * 9)),
    rotateZ: reduced ? 0 : Math.max(-5, Math.min(5, offset * 1.5)),
  }
}
