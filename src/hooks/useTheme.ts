import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

/* The theme lives on the document element, set by a blocking script in
   index.html before the first paint, and nowhere else. Keeping it in one
   place rather than in React state means the WebGL drum and the toggle read
   the same value without a provider between them, and the page can never
   render in one ground and repaint in the other.

   Paper is the default and the system preference is not consulted: dark is
   somewhere a visitor chooses to go. */
export const THEME_KEY = 'safar-theme'

const ground = { light: '#e6e4de', dark: '#16171a' }

const subscribe = (changed: () => void) => {
  const observer = new MutationObserver(changed)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  return () => observer.disconnect()
}

const read = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, (): Theme => 'light')

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next
    /* The browser's own chrome — the address bar on a phone — is part of the
       page as far as the eye is concerned. */
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', ground[next])
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* private mode, blocked storage: the choice simply does not outlive
         the visit, which is not worth failing over */
    }
  }, [])

  return [theme, setTheme] as const
}
