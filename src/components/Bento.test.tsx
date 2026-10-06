import { describe, expect, test } from 'bun:test'
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
