const server = Bun.serve({
  routes: {
    '/': Bun.file('./dist/index.html'),
    '/*': { dir: './dist' },
  },
})

console.log(`Preview running at ${server.url}`)
