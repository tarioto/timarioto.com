import { describe, expect, test } from 'bun:test'
import { renderMarkup } from '../test/renderMarkup'
import Hero from './Hero'

describe('Hero', () => {
  test('greets with the name and tagline', () => {
    const ui = <Hero name="Tim" tagline="Builds things." />
    expect(renderMarkup(ui, 'h1')[0]?.text).toMatch(/^Hi, I.+m Tim\.$/)
    expect(renderMarkup(ui, '.hero-tagline')[0]?.text).toBe('Builds things.')
  })

  test('links to the contact section', () => {
    const [button] = renderMarkup(<Hero name="Tim" tagline="" />, 'a.hero-button')
    expect(button?.attrs.href).toBe('#contact')
  })
})
