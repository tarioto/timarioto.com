import LiquidGlass from 'liquid-glass-react'
import { useRef } from 'react'
import './Hero.css'

interface HeroProps {
  name: string
  tagline: string
}

export default function Hero({ name, tagline }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null)

  return (
    <header className="hero" ref={heroRef}>
      <div className="hero-content">
        <h1 className="hero-headline">Hi, I&apos;m {name}.</h1>
        <p className="hero-tagline">{tagline}</p>
        <div className="hero-actions">
          <a className="hero-button hero-button-secondary" href="#contact">
            {/* LiquidGlass is absolutely positioned, so this hidden copy of the label sizes the link. */}
            <span className="hero-button-sizer" aria-hidden="true">
              Get in Touch
            </span>
            <LiquidGlass
              cornerRadius={8}
              padding="0.75rem 1.5rem"
              displacementScale={64}
              blurAmount={0.1}
              saturation={130}
              elasticity={0}
              mouseContainer={heroRef}
              style={{ position: 'absolute', top: '50%', left: '50%' }}
            >
              Get in Touch
            </LiquidGlass>
          </a>
        </div>
      </div>
    </header>
  )
}
