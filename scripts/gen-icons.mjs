import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svg = resolve(root, 'public/icon.svg')
const out = resolve(root, 'public/icons')

mkdirSync(out, { recursive: true })

const sizes = [
  { name: 'icon-192.png',    size: 192 },
  { name: 'icon-512.png',    size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png',  size: 32  },
]

for (const { name, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(resolve(out, name))
  console.log(`✅ ${name} (${size}x${size})`)
}
