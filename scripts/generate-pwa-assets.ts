import { mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import sharp from "sharp"

const rootDirectory = resolve(import.meta.dirname, "..")
const sourcePath = resolve(rootDirectory, "public/icons/app-icon-source.svg")

const assets = [
  { path: "public/icons/pwa-192x192.png", size: 192 },
  { path: "public/icons/pwa-512x512.png", size: 512 },
  { path: "public/apple-touch-icon.png", size: 180 },
] as const

for (const asset of assets) {
  const outputPath = resolve(rootDirectory, asset.path)
  await mkdir(dirname(outputPath), { recursive: true })
  await sharp(sourcePath)
    .resize(asset.size, asset.size)
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath)
}

const maskableSize = 512
const maskableOutputPath = resolve(
  rootDirectory,
  "public/icons/pwa-maskable-512x512.png",
)
const foreground = await sharp(sourcePath)
  .resize(320, 320)
  .png({ compressionLevel: 9, palette: true })
  .toBuffer()

await sharp({
  create: {
    background: "#11100f",
    channels: 4,
    height: maskableSize,
    width: maskableSize,
  },
})
  .composite([{ input: foreground, left: 96, top: 96 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(maskableOutputPath)
