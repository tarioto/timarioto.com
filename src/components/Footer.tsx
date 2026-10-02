import ContactLinks, { type ContactInfo } from './ContactLinks'
import './Footer.css'
import GlassBacking from './GlassBacking'

interface FooterProps extends ContactInfo {
  name: string
  year: number
}

export default function Footer({ name, year, ...contact }: FooterProps) {
  return (
    <footer className="footer page-section">
      <GlassBacking />
      <ContactLinks {...contact} />
      <p className="footer-copyright">
        © {year} {name}
      </p>
    </footer>
  )
}
