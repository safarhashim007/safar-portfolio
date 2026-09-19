import { useCallback, useEffect, useRef, useState } from 'react'

import { atPageBottom, fadeValue } from '../lib/playback'

import './music.css'

/* Quiet by design: the room tone sits under the work, it does not announce
   itself. Ten percent is the ceiling, and it is reached by a ramp rather
   than a switch so the first second is never a jolt. */
const TARGET_VOLUME = 0.1
const FADE_IN_MS = 1600
const FADE_OUT_MS = 700

/* Background sound that never ends turns into noise. Three minutes is about
   one pass through the work; after that the room goes quiet on its own. A
   deliberate click asks for it again and gets a fresh three. */
const MAX_PLAY_MS = 3 * 60 * 1000

/* Enough slack that a fractional smooth-scroll position still counts as the
   end of the page. */
const BOTTOM_SLACK = 24

const SRC = '/audio/after-dark.m4a'

export default function MusicPlayer() {
  const root = useRef<HTMLDivElement>(null)
  const audio = useRef<HTMLAudioElement>(null)
  const frame = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const budget = useRef(MAX_PLAY_MS)
  /* Set by the auto-start effect; called the moment the visitor takes charge. */
  const disarm = useRef(() => {})
  const since = useRef(0)
  const [playing, setPlaying] = useState(false)

  /* One ramp at a time: a second toggle cancels the first mid-flight instead
     of leaving two rAF loops fighting over the same volume. */
  const ramp = useCallback((to: number, ms: number, done?: () => void) => {
    const el = audio.current
    if (!el) return
    cancelAnimationFrame(frame.current)
    const from = el.volume
    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      el.volume = fadeValue(from, to, elapsed, ms)
      if (elapsed < ms) frame.current = requestAnimationFrame(step)
      else done?.()
    }
    frame.current = requestAnimationFrame(step)
  }, [])

  const halt = useCallback(() => {
    const el = audio.current
    if (!el) return
    clearTimeout(timer.current)
    /* The limit counts time actually played, not time since the visit began:
       a paused tab should not come back to silence. */
    if (since.current) budget.current -= performance.now() - since.current
    since.current = 0
    setPlaying(false)
    ramp(0, FADE_OUT_MS, () => el.pause())
  }, [ramp])

  const begin = useCallback(() => {
    const el = audio.current
    if (!el) return Promise.reject(new Error('no audio element'))
    if (!el.paused) return Promise.resolve()

    /* Silent before play() so a blocked-then-allowed start cannot leak a
       frame of full-volume audio. */
    el.volume = 0
    return el.play().then(() => {
      setPlaying(true)
      since.current = performance.now()
      timer.current = setTimeout(halt, budget.current)
      ramp(TARGET_VOLUME, FADE_IN_MS)
    })
  }, [halt, ramp])

  const toggle = useCallback(() => {
    disarm.current()
    if (playing) {
      halt()
      return
    }
    if (budget.current <= 0) budget.current = MAX_PLAY_MS
    void begin().catch(() => setPlaying(false))
  }, [begin, halt, playing])

  /* Sound is on by default, but no browser will take that on trust: a page
     nobody has touched yet is refused, so the refusal waits for a real
     gesture instead — and keeps waiting, because an attempt can be refused
     more than once and a visitor who never gets sound has no way to know
     why. Gestures on the control itself are left alone: that click is the
     toggle's to answer, and the toggle disarms this the moment it is used,
     so turning the sound off can never be undone by the next click. */
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchend'] as const
    const onGesture = (event: Event) => {
      if (root.current?.contains(event.target as Node)) return
      void begin().then(stop, () => {})
    }
    const stop = () => {
      for (const name of events) document.removeEventListener(name, onGesture)
    }
    disarm.current = stop

    void begin().then(stop, () => {
      for (const name of events) document.addEventListener(name, onGesture)
    })

    return stop
  }, [begin])

  /* The end of the page is the end of the piece. */
  useEffect(() => {
    if (!playing) return
    const onScroll = () => {
      const doc = document.documentElement
      if (atPageBottom(window.scrollY, window.innerHeight, doc.scrollHeight, BOTTOM_SLACK)) {
        halt()
        budget.current = 0
      }
    }
    /* Deliberately not called once up front: arriving at the bottom ends the
       piece, but opening a page the browser restored there should not. */
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [halt, playing])

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      clearTimeout(timer.current)
      audio.current?.pause()
    },
    [],
  )

  return (
    <div className="music" ref={root}>
      <audio ref={audio} src={SRC} loop preload="auto" />
      <button
        type="button"
        className="music-toggle readout"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Turn background sound off' : 'Turn background sound on'}
      >
        <span className="music-note" aria-hidden="true">
          ♪
        </span>
        <span className="music-word">Sound</span>
        <span className="music-eq" data-on={playing || undefined} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>
    </div>
  )
}
