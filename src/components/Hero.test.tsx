import { describe, expect, test } from 'bun:test'
import { renderMarkup } from '../test/renderMarkup'
import Hero from './Hero'

const contact = {
  email: 'hi@example.com',
  linkedin: 'https://linkedin.com/in/example',
  github: 'https://github.com/example',
}

describe('Hero', () => {
  test('greets with the name and tagline', () => {
    const ui = <Hero name="Tim" tagline="Builds things." {...contact} />
    expect(renderMarkup(ui, 'h1')[0]?.text).toMatch(/^Hi, I.+m Tim\.$/)
    expect(renderMarkup(ui, '.hero-tagline')[0]?.text).toBe('Builds things.')
  })

  test('sits on a glass panel labeled as the intro', () => {
    const ui = <Hero name="Tim" tagline="" {...contact} />
    expect(renderMarkup(ui, 'section')[0]?.attrs['aria-label']).toBe('Intro')
    expect(renderMarkup(ui, 'section > .glass-backing')).toHaveLength(1)
  })

  test('links the contact details', () => {
    const hrefs = renderMarkup(<Hero name="Tim" tagline="" {...contact} />, 'a').map((el) => el.attrs.href)
    expect(hrefs).toEqual(['mailto:hi@example.com', contact.linkedin, contact.github])
  })
})
