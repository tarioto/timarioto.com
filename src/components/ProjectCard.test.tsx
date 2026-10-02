import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import ProjectCard from './ProjectCard'

const vizrisk = {
  title: 'VIZRISK',
  description: 'Risk visualization tool.',
  url: 'https://vizrisk.timarioto.com',
  repo: 'https://github.com/tarioto/vizrisk',
  screenshot: '/projects/vizrisk.jpg',
}

interface RenderedElement {
  attrs: Record<string, string>
  ancestors: string[]
}

// Collects every element matching `selector` from the card's static markup,
// along with the tag names of its open ancestors.
function render(selector: string) {
  const html = renderToStaticMarkup(<ProjectCard {...vizrisk} />)
  const open: string[] = []
  const found: RenderedElement[] = []
  new HTMLRewriter()
    .on('*', {
      element(el) {
        if (!el.selfClosing && el.canHaveContent) {
          open.push(el.tagName)
          el.onEndTag(() => {
            open.pop()
          })
        }
      },
    })
    .on(selector, {
      element(el) {
        const isOpen = !el.selfClosing && el.canHaveContent
        found.push({ attrs: Object.fromEntries(el.attributes), ancestors: isOpen ? open.slice(0, -1) : [...open] })
      },
    })
    .transform(html)
  return found
}

describe('ProjectCard', () => {
  test('shows a screenshot of the production site', () => {
    const [img] = render('img')
    expect(img?.attrs.src).toBe('/projects/vizrisk.jpg')
    expect(img?.attrs.alt).toBe('VIZRISK screenshot')
  })

  test('links to the live site in a new tab', () => {
    const [site] = render('a[href="https://vizrisk.timarioto.com"]')
    expect(site?.attrs.target).toBe('_blank')
    expect(site?.attrs.rel).toBe('noopener noreferrer')
  })

  test('links to the source on GitHub', () => {
    const [github] = render('a[aria-label="VIZRISK on GitHub"]')
    expect(github?.attrs.href).toBe('https://github.com/tarioto/vizrisk')
    expect(github?.attrs.target).toBe('_blank')
    expect(github?.attrs.rel).toBe('noopener noreferrer')
  })

  test('never nests one link inside another', () => {
    const links = render('a')
    expect(links.filter((link) => link.ancestors.includes('a'))).toEqual([])
  })
})
