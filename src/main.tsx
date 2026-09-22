import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Set at runtime rather than a <link> tag in index.html: Bun's bundler
// treats any <link href> pointing to a local file as an asset to hash and
// move into dist/assets/, which would break the CI cache-control split
// that expects favicon.svg unhashed at the dist root.
const favicon = document.createElement('link')
favicon.rel = 'icon'
favicon.type = 'image/svg+xml'
favicon.href = '/favicon.svg'
document.head.appendChild(favicon)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
