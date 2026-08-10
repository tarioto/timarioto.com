import ContactLinks, { type ContactInfo } from './ContactLinks'
import styles from './Footer.module.css'

interface FooterProps extends ContactInfo {
  name: string
  year: number
}

export default function Footer({ name, year, ...contact }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <ContactLinks {...contact} />
      <p className={styles.copyright}>
        © {year} {name}
      </p>
    </footer>
  )
}
