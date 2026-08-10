import ContactLinks, { type ContactInfo } from './ContactLinks'
import styles from './ContactSection.module.css'

export default function ContactSection(props: ContactInfo) {
  return (
    <section id="contact" className={styles.section} aria-label="Contact">
      <h2 className={styles.title}>Contact</h2>
      <p className={styles.description}>Reach out — I&apos;m happy to hear from you.</p>
      <ContactLinks {...props} />
    </section>
  )
}
