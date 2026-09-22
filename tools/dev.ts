import homepage from '../index.html'

const publicFiles = ['favicon.svg', 'resume.pdf', 'song.json', 'album.json', 'trakt.json', 'weather.json'] as const

const server = Bun.serve({
  development: { hmr: true, console: true },
  routes: {
    '/': homepage,
    ...Object.fromEntries(publicFiles.map((name) => [`/${name}`, Bun.file(`public/${name}`)])),
  },
})

console.log(`Dev server running at ${server.url}`)
