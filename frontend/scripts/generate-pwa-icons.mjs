import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(path.join(dir, '../public/favicon.svg'), 'utf-8')

function render(size, outName, { maskable = false } = {}) {
  const source = maskable ? wrapMaskable(svg) : svg
  const resvg = new Resvg(source, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  writeFileSync(path.join(dir, '../public', outName), png)
  console.log(`wrote ${outName} (${size}x${size})`)
}

function wrapMaskable(originalSvg) {
  const openTagEnd = originalSvg.indexOf('>') + 1
  const closeTagStart = originalSvg.lastIndexOf('</svg>')
  const inner = originalSvg.slice(openTagEnd, closeTagStart)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="#059669"/>
    <g transform="translate(4.8 4.8) scale(0.7)">${inner}</g>
  </svg>`
}

render(192, 'pwa-192x192.png')
render(512, 'pwa-512x512.png')
render(512, 'pwa-maskable-512x512.png', { maskable: true })
render(180, 'apple-touch-icon.png')
