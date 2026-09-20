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

/* The shell in index.html is removed by the door itself, once the door has
   painted. Removing it here would be two frames too early: render() only
   schedules the work, so the shell would go while React had still committed
   nothing — a blank flash in the one place that exists to prevent one. */
