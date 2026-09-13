import styles from './Hero.module.css'
import HeroStarfield from './HeroStarfield'

interface HeroProps {
  name: string
  tagline: string
  resumeUrl: string
}

export default function Hero({ name, tagline, resumeUrl }: HeroProps) {
  return (
    <header className={styles.hero}>
      <HeroStarfield />
      <div className={styles.content}>
        <h1 className={styles.headline}>Hi, I&apos;m {name}.</h1>
        <p className={styles.tagline}>{tagline}</p>
        <div className={styles.actions}>
          <a className={styles.buttonPrimary} href={resumeUrl} download target="_blank" rel="noopener noreferrer">
            Download Résumé
          </a>
          <a className={styles.buttonSecondary} href="#contact">
            Get in Touch
          </a>
        </div>
      </div>
    </header>
  )
}
