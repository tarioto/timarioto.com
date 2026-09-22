import { $ } from 'bun'

await $`rm -rf dist`

const result = await Bun.build({
  entrypoints: ['./index.html'],
  outdir: './dist',
  minify: true,
  sourcemap: 'linked',
  naming: {
    entry: '[dir]/[name].[ext]',
    chunk: 'assets/[name]-[hash].[ext]',
    asset: 'assets/[name]-[hash].[ext]',
  },
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

// Copy through whatever's actually in public/, same as Vite's publicDir
// passthrough — trakt.json/weather.json/song.json/album.json are gitignored
// local-only samples (written for real by Lambda pollers / a local script,
// never committed), so they won't exist in CI and that's fine.
await $`cp -r public/. dist/`

console.log(`Build complete — ${result.outputs.length} file(s) written to dist/`)
for (const output of result.outputs) console.log(`  ${output.path}`)
