import type { ReactNode } from 'react'
import './GlassCard.css'
import GlassBacking from './GlassBacking'

interface GlassCardProps {
  href: string
  media: ReactNode
  // Artwork to blur behind the panel, so the glass has color to refract.
  backdropSrc: string | null
  children: ReactNode
}

// A linked card with its media on the left and its text on a liquid-glass
// panel beside it, set against a blurred copy of the artwork.
export default function GlassCard({ href, media, backdropSrc, children }: GlassCardProps) {
  return (
    <a className="glass-card" href={href} target="_blank" rel="noopener noreferrer">
      {backdropSrc && <img className="glass-card-backdrop" src={backdropSrc} alt="" aria-hidden="true" />}
      <div className="glass-card-media">{media}</div>
      {/* Square corners: the card clips the panel to its own rounded ones. */}
      <div className="glass-card-panel">
        <GlassBacking radius={0} />
        <div className="glass-card-body">{children}</div>
      </div>
    </a>
  )
}
