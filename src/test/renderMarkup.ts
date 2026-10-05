import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export interface RenderedElement {
  attrs: Record<string, string>
  ancestors: string[]
  // Raw text content, HTML entities left encoded.
  text: string
}

// Collects every element matching `selector` from the static markup of `ui`,
// along with the tag names of its open ancestors and its text content.
export function renderMarkup(ui: ReactElement, selector: string): RenderedElement[] {
  const html = renderToStaticMarkup(ui)
  const open: string[] = []
  const found: RenderedElement[] = []
  // Matches whose end tag hasn't been reached yet, with their stack depth.
  // An element only gets one end-tag handler, so the '*' handler closes these.
  let collecting: { match: RenderedElement; depth: number }[] = []
  new HTMLRewriter()
    .on('*', {
      element(el) {
        if (!el.selfClosing && el.canHaveContent) {
          open.push(el.tagName)
          el.onEndTag(() => {
            open.pop()
            collecting = collecting.filter(({ depth }) => depth <= open.length)
          })
        }
      },
    })
    .on(selector, {
      element(el) {
        const isOpen = !el.selfClosing && el.canHaveContent
        const match = {
          attrs: Object.fromEntries(el.attributes),
          ancestors: open.slice(0, isOpen ? -1 : undefined),
          text: '',
        }
        found.push(match)
        if (isOpen) collecting.push({ match, depth: open.length })
      },
    })
    .onDocument({
      text(chunk) {
        for (const { match } of collecting) match.text += chunk.text
      },
    })
    .transform(html)
  return found
}
