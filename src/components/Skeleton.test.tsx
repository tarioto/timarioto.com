import { describe, expect, test } from 'bun:test'
import { renderMarkup } from '../test/renderMarkup'
import Skeleton from './Skeleton'

describe('Skeleton', () => {
  test('is a hidden placeholder spanning the line by default', () => {
    const [el] = renderMarkup(<Skeleton />, '.skeleton-text')
    expect(el?.attrs['aria-hidden']).toBe('true')
    expect(el?.attrs.style).toBe('width:100%')
  })

  test('takes a width', () => {
    expect(renderMarkup(<Skeleton width="3em" />, '.skeleton-text')[0]?.attrs.style).toBe('width:3em')
  })
})
