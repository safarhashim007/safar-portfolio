import { useMemo } from 'react'
import { useMediaQuery } from './useMediaQuery'
import { useReducedMotion } from './useReducedMotion'

export interface Quality {
  /** WebGL is available at all. */
  webgl: boolean
  /** Upper device-pixel-ratio bound handed to the renderer. */
  dpr: [number, number]
  /** Coarse pointer: no hover affordances, touch-safe hit areas. */
  touch: boolean
  reduced: boolean
  /** Fewer cards, fewer textures, cheaper shading. */
  low: boolean
}

let probe: boolean | null = null

/** One context probe for the whole session; creating and dropping several is
 *  itself a way to hit the browser's context limit. */
function supportsWebGL(): boolean {
  if (probe !== null) return probe
  try {
    const canvas = document.createElement('canvas')
    probe = Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    )
  } catch {
    probe = false
  }
  return probe
}

export function useDeviceQuality(): Quality {
  const reduced = useReducedMotion()
  const touch = useMediaQuery('(pointer: coarse)')
  const narrow = useMediaQuery('(max-width: 900px)')

  return useMemo(() => {
    const webgl = typeof document !== 'undefined' && supportsWebGL()
    const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 4) : 4
    const low = narrow || touch || cores <= 4

    return {
      webgl,
      // Beyond 1.75 the cost is real and the gain is not visible on artwork
      // this size; phones are held further from the eye than they feel.
      dpr: low ? [1, 1.35] : [1, 1.75],
      touch,
      reduced,
      low,
    }
  }, [narrow, touch, reduced])
}
