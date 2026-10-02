import homepage from '../index.html'

const server = Bun.serve({
  development: { hmr: true, console: true },
  routes: {
    '/': homepage,
  },
  // Serve whatever's in public/, same as the build copies it into dist/.
  // URL parsing normalizes away `..` segments, so this stays inside public/.
  async fetch(req) {
    const file = Bun.file(`./public${new URL(req.url).pathname}`)
    return (await file.exists()) ? new Response(file) : new Response('Not Found', { status: 404 })
  },
})

console.log(`Dev server running at ${server.url}`)
