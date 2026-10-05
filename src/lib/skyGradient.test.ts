import { describe, expect, test } from 'bun:test'
import { skyGradientForTemp } from './skyGradient'

describe('skyGradientForTemp', () => {
  test('hits each stop exactly', () => {
    expect(skyGradientForTemp(-10)).toEqual({ top: 'rgb(4, 6, 14)', bottom: 'rgb(16, 36, 72)' })
    expect(skyGradientForTemp(20)).toEqual({ top: 'rgb(7, 8, 17)', bottom: 'rgb(92, 62, 98)' })
    expect(skyGradientForTemp(35)).toEqual({ top: 'rgb(10, 8, 15)', bottom: 'rgb(186, 88, 58)' })
  })

  test('interpolates between stops', () => {
    // Halfway between the 20°C and 30°C stops.
    expect(skyGradientForTemp(25)).toEqual({ top: 'rgb(8, 8, 17)', bottom: 'rgb(121, 67, 84)' })
  })

  test('clamps temperatures outside the range', () => {
    expect(skyGradientForTemp(-40)).toEqual(skyGradientForTemp(-10))
    expect(skyGradientForTemp(50)).toEqual(skyGradientForTemp(35))
  })

  test('uses a mild default without a temperature', () => {
    expect(skyGradientForTemp(null)).toEqual(skyGradientForTemp(15))
  })
})
