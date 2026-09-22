import { useRef } from 'react'
import LiquidGlass from 'liquid-glass-react'
import styles from './Hero.module.css'
import HeroStarfield from './HeroStarfield'

interface HeroProps {
  name: string
  tagline: string
  resumeUrl: string
}

export default function Hero({ name, tagline, resumeUrl }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null)

  return (
    <header className={styles.hero} ref={heroRef}>
      <HeroStarfield />
      <div className={styles.content}>
        <h1 className={styles.headline}>Hi, I&apos;m {name}.</h1>
        <p className={styles.tagline}>{tagline}</p>
        <div className={styles.actions}>
          <a className={styles.buttonPrimary} href={resumeUrl} download target="_blank" rel="noopener noreferrer">
            Download Résumé
          </a>
          <a className={styles.buttonSecondary} href="#contact">
            <LiquidGlass
              cornerRadius={8}
              padding="0.75rem 1.5rem"
              displacementScale={64}
              blurAmount={0.1}
              saturation={130}
              elasticity={0.25}
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
