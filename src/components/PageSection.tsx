import type { ComponentPropsWithoutRef } from 'react'
import GlassBacking from './GlassBacking'
import './PageSection.css'

interface PageSectionProps extends ComponentPropsWithoutRef<'section'> {
  as?: 'section' | 'footer'
}

// A top-level page section, set on a liquid-glass panel over the starfield.
export default function PageSection({ as: Tag = 'section', className, children, ...rest }: PageSectionProps) {
  return (
    <Tag className={`${className ?? ''} page-section`} {...rest}>
      <GlassBacking />
      {children}
    </Tag>
  )
}
