import { describe, expect, test } from 'bun:test'
import { renderMarkup } from '../test/renderMarkup'
import Footer from './Footer'

const props = {
  name: 'Tim Arioto',
  year: 2026,
  email: 'hi@example.com',
  linkedin: 'https://linkedin.com/in/example',
  github: 'https://github.com/example',
}

describe('Footer', () => {
  test('renders as a footer without a glass panel', () => {
    const [footer] = renderMarkup(<Footer {...props} />, 'footer')
    expect(footer?.attrs.class).toContain('page-section')
    expect(renderMarkup(<Footer {...props} />, '.glass-backing')).toEqual([])
  })

  test('shows the copyright line', () => {
    expect(renderMarkup(<Footer {...props} />, '.footer-copyright')[0]?.text).toBe('© 2026 Tim Arioto')
  })

  test('includes the contact links', () => {
    expect(renderMarkup(<Footer {...props} />, 'a').length).toBe(3)
  })
})
