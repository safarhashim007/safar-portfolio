/**
 * The two pieces of the sound control that are pure arithmetic, kept out of
 * the component so they can be checked without a browser.
 */

/**
 * One step of a volume ramp.
 *
 * The clamps are the whole point. A requestAnimationFrame callback is handed
 * the timestamp of the start of its frame, which can predate the
 * performance.now() taken when the ramp was armed, so elapsed can arrive
 * negative; an unclamped ramp then asks HTMLMediaElement for a volume outside
 * [0, 1] and the browser throws an IndexSizeError on the very first frame.
 */
export function fadeValue(from: number, to: number, elapsed: number, ms: number): number {
  const k = Math.min(1, Math.max(0, elapsed / ms))
  return from + (to - from) * k
}

/**
 * Has the page been scrolled to its end?
 *
 * Smooth scrolling leaves a fractional scroll position while scrollHeight is
 * an integer, so an exact comparison can miss the bottom entirely and the
 * sound would simply never stop. The slack is what makes the test fire.
 */
export function atPageBottom(
  scrollY: number,
  viewport: number,
  documentHeight: number,
  slack: number,
): boolean {
  return documentHeight - (scrollY + viewport) <= slack
}
