import type { ReactNode } from 'react'
import './IconLink.css'

interface IconLinkProps {
  href: string
  label: string
  icon: ReactNode
  external?: boolean
}

export default function IconLink({ href, label, icon, external = true }: IconLinkProps) {
  return (
    <a
      className="icon-link"
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {icon}
    </a>
  )
}
