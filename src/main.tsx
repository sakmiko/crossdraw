import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/ui/layout/App'
import '@/ui/styles.css'

const saved = localStorage.getItem('crossdraw-theme')
document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
