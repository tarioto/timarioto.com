import './Footer.css'
import PageSection from './PageSection'

interface FooterProps {
  name: string
  year: number
}

export default function Footer({ name, year }: FooterProps) {
  return (
    <PageSection as="footer" className="footer" glass={false}>
      <p className="footer-copyright">
        © {year} {name}
      </p>
    </PageSection>
  )
}
