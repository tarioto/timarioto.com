import ContactLinks, { type ContactInfo } from './ContactLinks'
import './Hero.css'
import PageSection from './PageSection'

interface HeroProps extends ContactInfo {
  name: string
  tagline: string
}

export default function Hero({ name, tagline, ...contact }: HeroProps) {
  return (
    <PageSection className="hero" aria-label="Intro">
      <h1 className="hero-headline">Hi, I&apos;m {name}.</h1>
      <p className="hero-tagline">{tagline}</p>
      <ContactLinks {...contact} />
    </PageSection>
  )
}
