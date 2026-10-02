import GlassBacking from './GlassBacking'
import './Hero.css'

interface HeroProps {
  name: string
  tagline: string
}

export default function Hero({ name, tagline }: HeroProps) {
  return (
    <header className="hero">
      <div className="hero-content">
        <h1 className="hero-headline">Hi, I&apos;m {name}.</h1>
        <p className="hero-tagline">{tagline}</p>
        <div className="hero-actions">
          <a className="hero-button hero-button-secondary" href="#contact">
            <GlassBacking radius={8} />
            <span>Get in Touch</span>
          </a>
        </div>
      </div>
    </header>
  )
}
