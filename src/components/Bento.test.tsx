import { describe, expect, test } from 'bun:test'
import { fireEvent, render, screen } from '@testing-library/react'
import { renderMarkup } from '../test/renderMarkup'
import Bento from './Bento'

describe('Bento', () => {
  const ui = <Bento main={<p className="a" />} side={<p className="b" />} footer={<footer />} />

  test('puts the main and side tiles in their columns', () => {
    expect(renderMarkup(ui, '.a')[0]?.ancestors.slice(-2)).toEqual(['main', 'div'])
    expect(renderMarkup(ui, '.bento-main > .a')).toHaveLength(1)
    expect(renderMarkup(ui, '.bento-side > .b')).toHaveLength(1)
  })

  test('sets the footer below the grid', () => {
    expect(renderMarkup(ui, '.bento > footer')).toHaveLength(1)
  })
})

describe('Bento toggle', () => {
  const ui = <Bento main={<a href="/a">Intro</a>} side={<p />} footer={<footer />} />

  test('tucks the tiles away, out of reach of the keyboard, and brings them back', () => {
    const { container } = render(ui)
    const bento = container.querySelector<HTMLElement>('.bento')!
    expect(bento.dataset.tucked).toBeUndefined()
    expect(bento.inert).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Hide content to see the sky' }))
    expect(bento.dataset.tucked).toBe('true')
    expect(bento.inert).toBe(true)

    const show = screen.getByRole('button', { name: 'Show content' })
    expect(show.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(show)
    expect(bento.dataset.tucked).toBeUndefined()
    expect(bento.inert).toBe(false)
  })

  test('keeps the toggle outside the part it hides', () => {
    const { container } = render(ui)
    expect(container.querySelector('.bento .bento-toggle')).toBeNull()
    expect(container.querySelector('.bento-toggle')).not.toBeNull()
  })
})
