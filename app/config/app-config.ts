export type AppIcon = {
  readonly src: `/${string}`
  readonly sizes: `${number}x${number}`
  readonly type: "image/png"
  readonly purpose?: "any" | "maskable"
}

export type AppConfig = {
  readonly backgroundColor: `#${string}`
  readonly description: string
  readonly display: "standalone"
  readonly icons: readonly AppIcon[]
  readonly locale: string
  readonly name: string
  readonly scope: `/${string}`
  readonly shortName: string
  readonly startUrl: `/${string}`
  readonly themeColor: {
    readonly dark: `#${string}`
    readonly light: `#${string}`
  }
}

export const appConfig = {
  backgroundColor: "#faf9f7",
  description:
    "A focused personal workspace for todos and founder conversations.",
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
  locale: "en",
  name: "Personal App",
  scope: "/",
  shortName: "Personal",
  startUrl: "/",
  themeColor: {
    dark: "#11100f",
    light: "#faf9f7",
  },
} as const satisfies AppConfig
