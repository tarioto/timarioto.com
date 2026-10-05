import { describe, expect, test } from 'bun:test'
import { renderMarkup } from '../test/renderMarkup'
import PageSection from './PageSection'

describe('PageSection', () => {
  test('renders a section on a glass panel by default', () => {
    const ui = <PageSection className="projects" aria-label="Projects" />
    const [section] = renderMarkup(ui, 'section')
    expect(section?.attrs.class).toBe('projects page-section')
    expect(section?.attrs['aria-label']).toBe('Projects')
    expect(renderMarkup(ui, 'section > .glass-backing').length).toBe(1)
  })

  test('can render as a footer without glass', () => {
    const ui = <PageSection as="footer" glass={false} />
    expect(renderMarkup(ui, 'footer')[0]?.attrs.class).toBe(' page-section')
    expect(renderMarkup(ui, '.glass-backing')).toEqual([])
  })
})
