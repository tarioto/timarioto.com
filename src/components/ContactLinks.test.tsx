import { describe, expect, test } from 'bun:test'
import { renderMarkup } from '../test/renderMarkup'
import ContactLinks from './ContactLinks'

const contact = {
  email: 'hi@example.com',
  linkedin: 'https://linkedin.com/in/example',
  github: 'https://github.com/example',
}

describe('ContactLinks', () => {
  test('links email with mailto in the same tab', () => {
    const [email] = renderMarkup(<ContactLinks {...contact} />, 'a[aria-label="Email"]')
    expect(email?.attrs.href).toBe('mailto:hi@example.com')
    expect(email?.attrs.target).toBeUndefined()
  })

  test('opens profile links in a new tab', () => {
    const links = renderMarkup(<ContactLinks {...contact} />, 'a[target="_blank"]')
    expect(links.map((link) => link.attrs.href)).toEqual([contact.linkedin, contact.github])
    expect(links.every((link) => link.attrs.rel === 'noopener noreferrer')).toBe(true)
  })

  test('only shows Instagram when given', () => {
    expect(renderMarkup(<ContactLinks {...contact} />, 'a[aria-label="Instagram profile"]')).toEqual([])
    const [instagram] = renderMarkup(
      <ContactLinks {...contact} instagram="https://instagram.com/example" />,
      'a[aria-label="Instagram profile"]',
    )
    expect(instagram?.attrs.href).toBe('https://instagram.com/example')
  })
})
