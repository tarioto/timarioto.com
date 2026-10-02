import LiquidGlass from 'liquid-glass-react'
import { type ReactNode, useRef } from 'react'
import './GlassCard.css'

interface GlassCardProps {
  href: string
  media: ReactNode
  // Artwork to blur behind the panel, so the glass has color to refract.
  backdropSrc: string | null
  children: ReactNode
}

// A linked card with its media on top and its text on a liquid-glass panel
// below, set against a blurred copy of the artwork.
export default function GlassCard({ href, media, backdropSrc, children }: GlassCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)

  return (
    <a className="glass-card" ref={cardRef} href={href} target="_blank" rel="noopener noreferrer">
      {backdropSrc && <img className="glass-card-backdrop" src={backdropSrc} alt="" aria-hidden="true" />}
      <div className="glass-card-media">{media}</div>
      <div className="glass-card-panel">
        {/* The glass is an empty, absolutely positioned backdrop sized to the
            panel; the real text renders on top of it, outside the library's
            hardcoded label styles. Elasticity is off so the glass doesn't
            stretch away from the text it sits behind. */}
        <LiquidGlass
          className="glass-card-glass"
          cornerRadius={0}
          padding="0"
          displacementScale={24}
          blurAmount={0.1}
          saturation={130}
          elasticity={0}
          mouseContainer={cardRef}
          style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%' }}
        >
          {null}
        </LiquidGlass>
        <div className="glass-card-body">{children}</div>
      </div>
    </a>
  )
}
