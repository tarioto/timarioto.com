import { describe, expect, setSystemTime, test } from 'bun:test'
import App from './App'
import { renderMarkup } from './test/renderMarkup'

describe('App', () => {
  test('lays out the static sections around the main content', () => {
    const sections = renderMarkup(<App />, '[aria-label]').map((el) => el.attrs['aria-label'])
    expect(sections).toContain('Projects')
    expect(sections).toContain('Contact')
    // The live-data sections render nothing until their data loads.
    expect(sections).not.toContain('Weather')
  })

  test("points the hero's Get in Touch link at the contact section", () => {
    const [link] = renderMarkup(<App />, 'a.hero-button')
    const targets = renderMarkup(<App />, `[id="${link?.attrs.href?.slice(1)}"]`)
    expect(targets.map((el) => el.attrs['aria-label'])).toEqual(['Contact'])
  })

  test('lists every project', () => {
    expect(renderMarkup(<App />, '.projects-section-grid > *')).toHaveLength(3)
  })

  test('dates the copyright to the current year', () => {
    setSystemTime(new Date('2031-06-01T00:00:00Z'))
    expect(renderMarkup(<App />, '.footer-copyright')[0]?.text).toBe('© 2031 Tim Arioto')
    setSystemTime()
  })
})
