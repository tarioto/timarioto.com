import LiquidGlass from 'liquid-glass-react'
import { useRef } from 'react'
import { useElementSize } from '../hooks/useElementSize'
import './PageGlass.css'

// A liquid-glass backing for a page section, shown in light mode only (see
// PageGlass.css). Render it as the first child of a `.page-section`; it fills
// the section and sits behind the section's content.
export default function PageGlass() {
  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(ref)

  return (
    <div className="page-glass" ref={ref} aria-hidden="true">
      {/* Shader mode builds its displacement map for the panel's measured size
          (the default map is a fixed pill that a tall panel crops the side
          edges off), so remount whenever the section resizes. Hidden in dark
          mode, the wrapper measures 0×0 and the glass isn't rendered at all. */}
      {width > 0 && height > 0 && (
        <LiquidGlass
          key={`${width}x${height}`}
          mode="shader"
          cornerRadius={16}
          padding="0"
          displacementScale={40}
          blurAmount={0.1}
          saturation={150}
          elasticity={0}
          style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%' }}
        >
          {null}
        </LiquidGlass>
      )}
    </div>
  )
}
