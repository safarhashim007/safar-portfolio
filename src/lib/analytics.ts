/**
 * A configuration point, not an integration.
 *
 * Nothing loads unless VITE_ANALYTICS_SRC is set at build time, so the
 * default build ships no analytics, no cookies and no third-party requests.
 * No provider is assumed and no ID is hard-coded: the script URL and any
 * data-* attributes it needs both come from the environment. See
 * .env.example.
 */

/* Typed locally rather than through vite/client: the smoke test compiles
   src/ with a bare tsconfig that has no Vite types, and a missing ImportMeta
   augmentation there fails the build. Vite still substitutes the whole
   import.meta.env object, so this reads correctly at runtime. */
interface AnalyticsEnv {
  readonly VITE_ANALYTICS_SRC?: string
  readonly VITE_ANALYTICS_DATA?: string
}

export function mountAnalytics(): void {
  const env = (import.meta as unknown as { env?: AnalyticsEnv }).env
  const src = env?.VITE_ANALYTICS_SRC
  if (!src) return

  const script = document.createElement('script')
  script.src = src
  script.defer = true

  // "website-id=abc,domain=example.com" -> data-website-id, data-domain
  for (const pair of (env?.VITE_ANALYTICS_DATA ?? '').split(',')) {
    const at = pair.indexOf('=')
    if (at < 1) continue
    script.setAttribute(`data-${pair.slice(0, at).trim()}`, pair.slice(at + 1).trim())
  }

  document.head.append(script)
}
