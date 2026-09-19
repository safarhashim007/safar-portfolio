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
