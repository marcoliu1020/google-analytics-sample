import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AnalyticsScript } from './analytics'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AnalyticsScript />
    <App />
  </StrictMode>,
)
