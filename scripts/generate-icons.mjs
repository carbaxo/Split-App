// Genera los iconos PNG de la PWA (necesarios para instalar en Android) a partir
// de un diseño simple: cuadrado redondeado índigo con la letra "S".
// No depende de librerías externas: escribe PNG a mano con zlib.
//
// Uso: npm run icons
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [99, 102, 241] // #6366f1 índigo
const FG = [255, 255, 255]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// "S" dibujada en una rejilla 5x7 (1 = pixel de tinta).
const GLYPH = [
  '01110',
  '10001',
  '10000',
  '01110',
  '00001',
  '10001',
  '01110',
]

function makePng(size) {
  const px = (x, y) => {
    // Mapea la rejilla del glifo a la zona central del icono.
    const gw = 5
    const gh = 7
    const scale = Math.floor(size / 9)
    const ox = Math.floor((size - gw * scale) / 2)
    const oy = Math.floor((size - gh * scale) / 2)
    if (x >= ox && x < ox + gw * scale && y >= oy && y < oy + gh * scale) {
      const gx = Math.floor((x - ox) / scale)
      const gy = Math.floor((y - oy) / scale)
      if (GLYPH[gy][gx] === '1') return FG
    }
    return BG
  }

  // Datos RGBA con byte de filtro 0 al inicio de cada fila.
  const raw = Buffer.alloc((size * 4 + 1) * size)
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = px(x, y)
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
      raw[p++] = 255
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const targets = [
  ['public/pwa-192x192.png', 192],
  ['public/pwa-512x512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

for (const [path, size] of targets) {
  writeFileSync(path, makePng(size))
  console.log(`✓ ${path} (${size}x${size})`)
}
