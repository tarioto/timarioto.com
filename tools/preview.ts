const server = Bun.serve({
  routes: {
    '/': Bun.file('./dist/index.html'),
  },
  async fetch(req) {
    // URL parsing normalizes away `..` segments, so this stays inside dist/.
    const file = Bun.file(`./dist${new URL(req.url).pathname}`)
    return (await file.exists()) ? new Response(file) : new Response('Not Found', { status: 404 })
  },
})

console.log(`Preview running at ${server.url}`)
