import { describe, expect, test } from 'bun:test'
import { playsDescription } from './CurrentlyListeningSection'

describe('playsDescription', () => {
  test('joins the artist and play count', () => {
    expect(playsDescription('Radiohead', 12)).toBe('Radiohead · 12 plays')
  })

  test('uses the singular for one play', () => {
    expect(playsDescription('Radiohead', 1)).toBe('Radiohead · 1 play')
  })

  test('shows whichever part is present', () => {
    expect(playsDescription(null, 3)).toBe('3 plays')
    expect(playsDescription('Radiohead', null)).toBe('Radiohead')
    expect(playsDescription('Radiohead', 0)).toBe('Radiohead')
  })

  test('returns null when there is nothing to show', () => {
    expect(playsDescription(null, null)).toBeNull()
  })
})
