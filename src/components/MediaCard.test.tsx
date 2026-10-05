import { describe, expect, test } from 'bun:test'
import { fireEvent, render, screen } from '@testing-library/react'
import MediaCard from './MediaCard'

const props = {
  href: 'https://example.com/item',
  imageSrc: 'https://example.com/art.jpg',
  aspect: 'square' as const,
  fallback: '🎧',
  kicker: 'Song of the month',
  title: 'Weird Fishes',
}

describe('MediaCard', () => {
  test('links the whole card to the item', () => {
    render(<MediaCard {...props} />)
    expect(screen.getByRole('link', { name: /Weird Fishes/ }).getAttribute('href')).toBe(props.href)
    expect(screen.getByText('Song of the month')).toBeDefined()
  })

  test('shows the description only when there is one', () => {
    const { container, rerender } = render(<MediaCard {...props} />)
    expect(container.querySelector('.media-card-description')).toBeNull()
    rerender(<MediaCard {...props} description="Radiohead" />)
    expect(screen.getByText('Radiohead')).toBeDefined()
  })

  test('sizes the thumbnail for its aspect', () => {
    const { container } = render(<MediaCard {...props} aspect="poster" />)
    const img = container.querySelector('img.media-card-image')!
    expect(img.classList.contains('media-card-image-poster')).toBe(true)
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['342', '513'])
  })

  test('swaps in the fallback when there is no image', () => {
    const { container } = render(<MediaCard {...props} imageSrc={null} />)
    expect(container.querySelector('.media-card-image-fallback')?.textContent).toBe('🎧')
    expect(container.querySelector('.glass-card-backdrop')).toBeNull()
  })

  test('swaps in the fallback when the image fails to load', () => {
    const { container } = render(<MediaCard {...props} />)
    fireEvent.error(container.querySelector('img.media-card-image')!)
    expect(container.querySelector('.media-card-image-fallback')).not.toBeNull()
  })
})
