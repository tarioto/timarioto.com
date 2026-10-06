import { describe, expect, setSystemTime, test } from 'bun:test'
import App from './App'
import { renderMarkup } from './test/renderMarkup'

describe('App', () => {
  test('puts the intro and projects in the main column', () => {
    const sections = renderMarkup(<App />, '.bento-main > [aria-label]').map((el) => el.attrs['aria-label'])
    expect(sections).toEqual(['Intro', 'Projects'])
  })

  test('holds a placeholder for each live-data tile until its data loads', () => {
    const tiles = renderMarkup(<App />, '.bento-side > [aria-busy="true"]').map((el) => el.attrs['aria-label'])
    expect(tiles).toEqual(['Weather', 'Currently Listening', 'Currently Watching'])
  })

  test('links the contact details from the intro', () => {
    const labels = renderMarkup(<App />, '.hero a').map((el) => el.attrs['aria-label'])
    expect(labels).toEqual(['Email', 'LinkedIn profile', 'GitHub profile', 'Instagram profile'])
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
