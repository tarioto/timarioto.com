import { describe, expect, test } from 'bun:test'
import { renderMarkup } from '../test/renderMarkup'
import ProjectCard from './ProjectCard'

const vizrisk = {
  title: 'VIZRISK',
  description: 'Risk visualization tool.',
  url: 'https://vizrisk.timarioto.com',
  repo: 'https://github.com/tarioto/vizrisk',
  screenshot: '/projects/vizrisk.jpg',
}

const render = (selector: string) => renderMarkup(<ProjectCard {...vizrisk} />, selector)

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
