import './Hero.css'
import HeroStarfield from './HeroStarfield'

interface HeroProps {
  name: string
  tagline: string
  resumeUrl: string
}

export default function Hero({ name, tagline, resumeUrl }: HeroProps) {
  return (
    <header className="hero">
      <HeroStarfield />
      <div className="hero-content">
        <h1 className="hero-headline">Hi, I&apos;m {name}.</h1>
        <p className="hero-tagline">{tagline}</p>
        <div className="hero-actions">
          <a className="hero-button hero-button-primary" href={resumeUrl} download target="_blank" rel="noopener noreferrer">
            Download Résumé
          </a>
          <a className="hero-button hero-button-secondary" href="#contact">
            Get in Touch
          </a>
        </div>
      </div>
    </header>
  )
}
