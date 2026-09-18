import { useTheme } from '../hooks/useTheme'

import './theme.css'

/**
 * The same shape as the sound control beside it: a glyph, a word, and a
 * pressed state — two switches in one voice rather than two inventions.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle readout"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to the light ground' : 'Switch to the dark ground'}
    >
      <span className="theme-glyph" aria-hidden="true">
        {dark ? '●' : '○'}
      </span>
      <span className="theme-word">Dark</span>
    </button>
  )
}
