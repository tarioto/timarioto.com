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

await $`cp public/favicon.svg public/resume.pdf public/song.json public/album.json public/trakt.json public/weather.json dist/`

console.log(`Build complete — ${result.outputs.length} file(s) written to dist/`)
for (const output of result.outputs) console.log(`  ${output.path}`)
