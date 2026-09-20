import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { mountAnalytics } from './lib/analytics'

mountAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* The pre-boot shell in index.html has done its job the moment React has
   painted the real door over it. */
document.getElementById('boot')?.remove()
