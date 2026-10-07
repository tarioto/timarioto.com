import { expect, spyOn, test } from 'bun:test'
import { createRenderer } from './webglRenderer'

test("gives no renderer when the browser can't provide WebGL", () => {
  // happy-dom has no WebGL, like a browser with it turned off.
  const consoleError = spyOn(console, 'error').mockImplementation(() => {})
  expect(createRenderer(document.createElement('canvas'))).toBeNull()
  expect(consoleError).toHaveBeenCalled()
})
