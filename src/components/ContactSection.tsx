import ContactLinks, { type ContactInfo } from './ContactLinks'
import './ContactSection.css'
import PageSection from './PageSection'

export default function ContactSection(props: ContactInfo) {
  return (
    <PageSection id="contact" className="contact-section" aria-label="Contact">
      <h2 className="contact-section-title">Contact</h2>
      <p className="contact-section-description">Reach out — I&apos;m happy to hear from you.</p>
      <ContactLinks {...props} />
    </PageSection>
  )
}
