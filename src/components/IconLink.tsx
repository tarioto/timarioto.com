import type { ReactNode } from 'react'
import styles from './IconLink.module.css'

interface IconLinkProps {
  href: string
  label: string
  icon: ReactNode
  external?: boolean
}

export default function IconLink({ href, label, icon, external = true }: IconLinkProps) {
  return (
    <a
      className={styles.link}
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {icon}
    </a>
  )
}
