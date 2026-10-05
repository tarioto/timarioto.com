import type { ComponentPropsWithoutRef } from 'react'
import GlassBacking from './GlassBacking'
import './PageSection.css'

interface PageSectionProps extends ComponentPropsWithoutRef<'section'> {
  as?: 'section' | 'footer'
  // Without glass the section still gets the panel layout and light text,
  // straight on the starfield.
  glass?: boolean
  // Shown as the section's heading, and its accessible name unless
  // aria-label says otherwise.
  title?: string
}

// A top-level page section, set on a liquid-glass panel over the starfield.
export default function PageSection({
  as: Tag = 'section',
  glass = true,
  title,
  className,
  children,
  ...rest
}: PageSectionProps) {
  return (
    <Tag className={`${className ?? ''} page-section`} aria-label={title} {...rest}>
      {glass && <GlassBacking />}
      {title && <h2 className="page-section-title">{title}</h2>}
      {children}
    </Tag>
  )
}
