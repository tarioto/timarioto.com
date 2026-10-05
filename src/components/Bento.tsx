import type { ReactNode } from 'react'
import './Bento.css'

interface BentoProps {
  // The wide column: the intro and projects.
  main: ReactNode
  // The narrow column: the live-data tiles, any of which may render nothing.
  side: ReactNode
  footer: ReactNode
}

// The page layout: one screen of glass tiles in two columns on desktop, a
// single scrolling column on phones (see Bento.css).
export default function Bento({ main, side, footer }: BentoProps) {
  return (
    <div className="bento">
      <main className="bento-grid">
        <div className="bento-main">{main}</div>
        <div className="bento-side">{side}</div>
      </main>
      {footer}
    </div>
  )
}
