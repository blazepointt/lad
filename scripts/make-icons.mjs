// Одноразовый генератор PNG-иконок для PWA из favicon.svg
// Запуск: node scripts/make-icons.mjs

import { readFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const SVG = readFileSync('public/favicon.svg')
const BG = '#BC5B3C' // терракота по умолчанию
mkdirSync('public/icons', { recursive: true })

// Обычные иконки (прозрачные углы)
for (const size of [64, 180, 192, 512]) {
  await sharp(SVG, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`)
  console.log(`icon-${size}.png ✓`)
}

// apple-touch-icon: iOS не любит прозрачность — заливаем фон
await sharp({ create: { width: 180, height: 180, channels: 4, background: BG } })
  .composite([{ input: await sharp(SVG, { density: 300 }).resize(180, 180).png().toBuffer() }])
  .png()
  .toFile('public/icons/apple-touch-icon.png')
console.log('apple-touch-icon.png ✓')

// maskable: безопасная зона 80%, полный фон
const inner = await sharp(SVG, { density: 300 }).resize(410, 410).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: inner, top: 51, left: 51 }])
  .png()
  .toFile('public/icons/icon-maskable-512.png')
console.log('icon-maskable-512.png ✓')
