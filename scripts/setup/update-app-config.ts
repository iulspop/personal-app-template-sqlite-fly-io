import type { SetupConfig } from "./setup-config"

const appConfigDeclaration =
  /export const appConfig = \{[\s\S]*?\n\} as const satisfies AppConfig\n?/

export function renderAppConfig(config: SetupConfig) {
  return `export const appConfig = {
  backgroundColor: "#faf9f7",
  description: ${JSON.stringify(config.description)},
  display: "standalone",
  icons: [
    {
      purpose: "any",
      sizes: "192x192",
      src: "/icons/pwa-192x192.png",
      type: "image/png",
    },
    {
      purpose: "any",
      sizes: "512x512",
      src: "/icons/pwa-512x512.png",
      type: "image/png",
    },
    {
      purpose: "maskable",
      sizes: "512x512",
      src: "/icons/pwa-maskable-512x512.png",
      type: "image/png",
    },
  ],
  locale: ${JSON.stringify(config.locale)},
  name: ${JSON.stringify(config.appName)},
  scope: "/",
  shortName: ${JSON.stringify(config.shortName)},
  startUrl: "/",
  themeColor: {
    dark: "#11100f",
    light: "#faf9f7",
  },
} as const satisfies AppConfig
`
}

export function updateAppConfigSource(source: string, config: SetupConfig) {
  const matches = source.match(new RegExp(appConfigDeclaration.source, "g"))
  if (matches?.length !== 1) {
    throw new Error("Expected exactly one canonical appConfig declaration")
  }
  return source.replace(appConfigDeclaration, renderAppConfig(config))
}
