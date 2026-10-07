import { afterEach, beforeEach, describe, expect, jest, spyOn, test } from 'bun:test'
import { act, render, waitFor } from '@testing-library/react'
import { stubGeolocation } from '../test/stubs'
import SkyBackground from './SkyBackground'

// Times in New York, which the sky uses until the visitor shares a location.
const AFTERNOON = new Date('2026-10-07T19:00:00Z')
const NIGHT = new Date('2026-10-08T03:00:00Z')
// Sunset is 6:31 pm and civil twilight ends at 6:58 pm.
const DUSK = new Date('2026-10-07T22:50:00Z')

let restoreGeolocation = () => {}

beforeEach(() => {
  restoreGeolocation = stubGeolocation('pending')
  // happy-dom has no WebGL, so three.js complains and the day sky falls back to CSS.
  spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  restoreGeolocation()
  jest.useRealTimers()
})

describe('SkyBackground', () => {
  test('shows the 3D sun path by day', async () => {
    jest.useFakeTimers({ now: AFTERNOON })
    const { container } = render(<SkyBackground />)
    jest.useRealTimers()
    await waitFor(() => expect(container.querySelector('.day-sky')).not.toBeNull())
    expect(container.querySelector('.starfield-container')).toBeNull()
  })

  test('shows the starfield at night', () => {
    jest.useFakeTimers({ now: NIGHT })
    const { container } = render(<SkyBackground />)
    expect(container.querySelector('.starfield-container')).not.toBeNull()
    expect(container.querySelector('.sky-background')).toBeNull()
  })

  test('switches to the starfield once twilight ends', () => {
    jest.useFakeTimers({ now: DUSK })
    const { container } = render(<SkyBackground />)
    expect(container.querySelector('.sky-background')).not.toBeNull()
    act(() => jest.advanceTimersByTime(10 * 60_000))
    expect(container.querySelector('.starfield-container')).not.toBeNull()
  })
})
