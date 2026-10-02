import LiquidGlass from 'liquid-glass-react'
import { type CSSProperties, useEffect, useRef } from 'react'
import { useElementSize } from '../hooks/useElementSize'
import './GlassBacking.css'

interface GlassBackingProps {
  radius?: number
}

// A liquid-glass backing (see GlassBacking.css). Render it as the first child
// of a section, card or button; it fills its parent and sits behind the
// parent's other content.
export default function GlassBacking({ radius = 16 }: GlassBackingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(ref)

  // liquid-glass-react measures itself on mount and window resize only, and
  // rebuilds its shader map from that measurement. When this backing resizes
  // for another reason (e.g. its section's data loading), nudge it with a
  // resize event; re-measuring in place avoids remounting, which would flash
  // the glass while the new map is built.
  useEffect(() => {
    if (width > 0 && height > 0) window.dispatchEvent(new Event('resize'))
  }, [width, height])

  return (
    <div
      className="glass-backing"
      ref={ref}
      style={{ '--glass-radius': `${radius}px` } as CSSProperties}
      aria-hidden="true"
    >
      {/* Shader mode builds its displacement map for the backing's measured
          size; the default map is a fixed pill that a tall panel crops the
          side edges off. */}
      <LiquidGlass
        mode="shader"
        cornerRadius={radius}
        padding="0"
        displacementScale={40}
        blurAmount={0.1}
        saturation={150}
        elasticity={0}
        style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%' }}
      >
        {null}
      </LiquidGlass>
    </div>
  )
}
