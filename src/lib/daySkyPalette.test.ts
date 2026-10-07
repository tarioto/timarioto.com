import { describe, expect, test } from 'bun:test'
import { daySkyCssGradient, daySkyPalette } from './daySkyPalette'

describe('daySkyPalette', () => {
  test('hits each stop exactly', () => {
    expect(daySkyPalette(0).zenith).toEqual([20, 34, 74])
    expect(daySkyPalette(25).horizon).toEqual([82, 128, 178])
  })

  test('interpolates between stops', () => {
    // Halfway between the 0° and 8° stops.
    expect(daySkyPalette(4).glow).toEqual([255, 162, 93])
  })

  test('clamps altitudes outside the range', () => {
    expect(daySkyPalette(-20)).toEqual(daySkyPalette(-6))
    expect(daySkyPalette(85)).toEqual(daySkyPalette(60))
  })
})

describe('daySkyCssGradient', () => {
  test('runs from the zenith down to a hard horizon over the ground', () => {
    expect(daySkyCssGradient(60)).toBe(
      'linear-gradient(to bottom, rgb(18, 72, 154), rgb(74, 130, 186) 70%, rgb(50, 66, 60) 70%)',
    )
  })
})
