import ContactLinks, { type ContactInfo } from './ContactLinks'
import './Footer.css'
import PageSection from './PageSection'

interface FooterProps extends ContactInfo {
  name: string
  year: number
}

export default function Footer({ name, year, ...contact }: FooterProps) {
  return (
    <PageSection as="footer" className="footer">
      <ContactLinks {...contact} />
      <p className="footer-copyright">
        © {year} {name}
      </p>
    </PageSection>
  )
}
