import { type ReactNode, useState } from 'react'
import './Bento.css'
import GlassBacking from './GlassBacking'

interface BentoProps {
  // The wide column: the intro and projects.
  main: ReactNode
  // The narrow column: the live-data tiles, any of which may render nothing.
  side: ReactNode
  footer: ReactNode
}

// The page layout: one screen of glass tiles in two columns on desktop, a
// single scrolling column on phones (see Bento.css). A button in the corner
// slides the tiles out of the way to show the sky behind them.
export default function Bento({ main, side, footer }: BentoProps) {
  const [tucked, setTucked] = useState(false)
  const label = tucked ? 'Show content' : 'Hide content to see the sky'

  return (
    <>
      <div className="bento" data-tucked={tucked || undefined} inert={tucked}>
        <main className="bento-grid">
          <div className="bento-main">{main}</div>
          <div className="bento-side">{side}</div>
        </main>
        {footer}
      </div>
      <button
        type="button"
        className="bento-toggle"
        aria-label={label}
        title={label}
        aria-pressed={tucked}
        onClick={() => setTucked((was) => !was)}
      >
        <GlassBacking radius={22} />
        <span className="bento-toggle-emoji" aria-hidden="true">
          {tucked ? '🐵' : '🙈'}
        </span>
      </button>
    </>
  )
}
