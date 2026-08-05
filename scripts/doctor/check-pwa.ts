import { access, readdir, stat } from "node:fs/promises"
import { resolve } from "node:path"
import sharp from "sharp"

import { appConfig } from "../../app/config/app-config"
import type { DoctorFinding } from "./doctor-types"

export async function checkPwa(
  projectRoot = process.cwd(),
): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = []
  const source = resolve(projectRoot, "public/icons/app-icon-source.svg")
  let sourceModified = 0
  try {
    sourceModified = (await stat(source)).mtimeMs
  } catch {
    findings.push({
      category: "pwa",
      id: "icon-source",
      message: "PWA icon source is missing.",
      remediation: "Add public/icons/app-icon-source.svg or run pnpm setup.",
      status: "fail",
    })
  }

  for (const icon of appConfig.icons) {
    const path = resolve(projectRoot, `public${icon.src}`)
    try {
      await access(path)
      const metadata = await sharp(path).metadata()
      const [width, height] = icon.sizes.split("x").map(Number)
      const fresh = (await stat(path)).mtimeMs >= sourceModified
      const valid = metadata.width === width && metadata.height === height
      findings.push({
        category: "pwa",
        id: `icon:${icon.sizes}:${icon.purpose ?? "any"}`,
        message:
          valid && fresh
            ? `${icon.src} is valid and current.`
            : `${icon.src} is invalid or older than the icon source.`,
        remediation: valid && fresh ? undefined : "Run pnpm pwa:assets.",
        status: valid && fresh ? "pass" : "fail",
      })
    } catch {
      findings.push({
        category: "pwa",
        id: `icon:${icon.sizes}:${icon.purpose ?? "any"}`,
        message: `${icon.src} is missing or unreadable.`,
        remediation: "Run pnpm pwa:assets.",
        status: "fail",
      })
    }
  }

  const publicFiles = await readdir(resolve(projectRoot, "public"), {
    recursive: true,
  })
  const serviceWorkers = publicFiles.filter((file) =>
    /(^|\/)(sw|service-worker)\.[cm]?[jt]s$/i.test(file),
  )
  findings.push({
    category: "pwa",
    id: "no-service-worker",
    message:
      serviceWorkers.length === 0
        ? "No service worker or offline cache entrypoint is present."
        : "A service worker file was found.",
    remediation:
      serviceWorkers.length === 0
        ? undefined
        : "Remove service worker files to preserve the minimum no-offline PWA contract.",
    status: serviceWorkers.length === 0 ? "pass" : "fail",
  })
  return findings
}
