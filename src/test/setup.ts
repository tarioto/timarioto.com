import { mock } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import type { ReactNode } from 'react'

GlobalRegistrator.register()

// liquid-glass-react draws its displacement map on a canvas, which happy-dom
// can't provide; render its children in a plain div instead.
mock.module('liquid-glass-react', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ children }: { children?: ReactNode }) => createElement('div', { 'data-liquid-glass': '' }, children),
  }
})

// Testing Library reads the DOM globals at import time, so load it only after
// happy-dom is registered.
const { cleanup } = await import('@testing-library/react')
const { afterEach } = await import('bun:test')

afterEach(() => {
  cleanup()
  mock.restore()
})
