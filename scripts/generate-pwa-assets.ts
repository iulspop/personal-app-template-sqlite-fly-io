import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import sharp from "sharp"

const rootDirectory = resolve(import.meta.dirname, "..")

export type PwaAssetEdit = {
  content: Uint8Array
  path: string
}

export async function createPwaAssetEdits({
  sourcePath,
}: {
  sourcePath: string
}): Promise<PwaAssetEdit[]> {
  const assets = [
    { path: "public/apple-touch-icon.png", size: 180 },
    { path: "public/icons/pwa-192x192.png", size: 192 },
    { path: "public/icons/pwa-512x512.png", size: 512 },
  ] as const
  const resizedAssets = await Promise.all(
    assets.map(async ({ path, size }) => ({
      content: await sharp(sourcePath)
        .resize(size, size)
        .png({ compressionLevel: 9, palette: true })
        .toBuffer(),
      path,
    })),
  )
  const foreground = await sharp(sourcePath)
    .resize(320, 320)
    .png({ compressionLevel: 9, palette: true })
    .toBuffer()
  const maskable = await sharp({
    create: {
      background: "#11100f",
      channels: 4,
      height: 512,
      width: 512,
    },
  })
    .composite([{ input: foreground, left: 96, top: 96 }])
    .png({ compressionLevel: 9, palette: true })
    .toBuffer()

  return [
    ...resizedAssets,
    {
      content: maskable,
      path: "public/icons/pwa-maskable-512x512.png",
    },
  ]
}

export async function generatePwaAssets({
  projectRoot = rootDirectory,
  sourcePath = resolve(projectRoot, "public/icons/app-icon-source.svg"),
}: {
  projectRoot?: string
  sourcePath?: string
} = {}) {
  await Promise.all(
    (await createPwaAssetEdits({ sourcePath })).map(
      async ({ content, path }) => {
        const outputPath = resolve(projectRoot, path)
        await mkdir(dirname(outputPath), { recursive: true })
        await writeFile(outputPath, content)
      },
    ),
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await generatePwaAssets()
}
