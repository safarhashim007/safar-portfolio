import { useEffect, useRef, useState } from 'react'

import MusicPlayer from './MusicPlayer'
import ThemeToggle from './ThemeToggle'

import './nav.css'

const links = [
  { id: 'projects', label: 'Projects', number: '01' },
  { id: 'art', label: 'Art', number: '02' },
  { id: 'photography', label: 'Photography', number: '03' },
  { id: 'about', label: 'About', number: '04' },
  { id: 'contact', label: 'Contact', number: '05' },
]

/**
 * The wordmark and one control, at the same place on every screen, whatever is
 * happening behind them. The full index lives in the overlay and nowhere else,
 * so there is exactly one place to look for it.
 */
export default function Nav() {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
      toggle.current?.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <>
      <a className="skip-link" href="#projects">
        Skip to content
      </a>

      <header className="nav">
        <a className="nav-mark" href="#home">
          ssaff<span aria-hidden="true">.666</span>
          <span className="visually-hidden">.666 — back to top</span>
        </a>

        <div className="nav-controls">
          <MusicPlayer />
          <ThemeToggle />

          <button
            type="button"
            className="nav-toggle readout"
            ref={toggle}
            aria-expanded={open}
            aria-controls="site-index"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close' : 'Menu'}
            <span aria-hidden="true">{open ? ' ×' : ' +'}</span>
          </button>
        </div>
      </header>

      <nav
        className={`index${open ? ' is-open' : ''}`}
        id="site-index"
        aria-label="Site index"
        inert={!open}
      >
        <p className="readout index-label">Index</p>

        <ul>
          {links.map((link) => (
            <li key={link.id}>
              <a href={`#${link.id}`} onClick={() => setOpen(false)}>
                <span className="readout">{link.number}</span>
                <span className="index-name">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="index-foot">
          <p className="readout">AI &amp; ML student · developer · visual artist</p>
          <a
            className="readout"
            href="https://github.com/safarhashim007"
            target="_blank"
            rel="noreferrer"
          >
            GitHub<span aria-hidden="true"> ↗</span>
          </a>
        </div>
      </nav>
    </>
  )
}
