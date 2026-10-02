import type { ComponentPropsWithoutRef } from 'react'
import GlassBacking from './GlassBacking'
import './PageSection.css'

interface PageSectionProps extends ComponentPropsWithoutRef<'section'> {
  as?: 'section' | 'footer'
  // Without glass the section still gets the panel layout and light text,
  // straight on the starfield.
  glass?: boolean
}

// A top-level page section, set on a liquid-glass panel over the starfield.
export default function PageSection({
  as: Tag = 'section',
  glass = true,
  className,
  children,
  ...rest
}: PageSectionProps) {
  return (
    <Tag className={`${className ?? ''} page-section`} {...rest}>
      {glass && <GlassBacking />}
      {children}
    </Tag>
  )
}
