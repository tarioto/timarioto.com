import ContactLinks, { type ContactInfo } from './ContactLinks'
import './Footer.css'
import PageGlass from './PageGlass'

interface FooterProps extends ContactInfo {
  name: string
  year: number
}

export default function Footer({ name, year, ...contact }: FooterProps) {
  return (
    <footer className="footer page-section">
      <PageGlass />
      <ContactLinks {...contact} />
      <p className="footer-copyright">
        © {year} {name}
      </p>
    </footer>
  )
}
