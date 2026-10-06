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

  test('heads the section with its title, which also names it', () => {
    const ui = <PageSection title="Weather" />
    expect(renderMarkup(ui, 'section')[0]?.attrs['aria-label']).toBe('Weather')
    expect(renderMarkup(ui, 'section > h2.page-section-title')[0]?.text).toBe('Weather')
  })

  test('lets aria-label override the title as its name', () => {
    const ui = <PageSection title="Weather" aria-label="Local weather" />
    expect(renderMarkup(ui, 'section')[0]?.attrs['aria-label']).toBe('Local weather')
  })

  test('can render as a footer without glass', () => {
    const ui = <PageSection as="footer" glass={false} />
    expect(renderMarkup(ui, 'footer')[0]?.attrs.class).toBe(' page-section')
    expect(renderMarkup(ui, '.glass-backing')).toEqual([])
  })
})
