import ContactLinks, { type ContactInfo } from './ContactLinks'
import './ContactSection.css'
import PageGlass from './PageGlass'

export default function ContactSection(props: ContactInfo) {
  return (
    <section id="contact" className="contact-section page-section" aria-label="Contact">
      <PageGlass />
      <h2 className="contact-section-title">Contact</h2>
      <p className="contact-section-description">Reach out — I&apos;m happy to hear from you.</p>
      <ContactLinks {...props} />
    </section>
  )
}
