import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const expectedIcons = [
  { sizes: "192x192", src: "/icons/pwa-192x192.png" },
  { sizes: "512x512", src: "/icons/pwa-512x512.png" },
  { sizes: "512x512", src: "/icons/pwa-maskable-512x512.png" },
]

test.describe("minimum installable PWA shell", () => {
  test("given: the production app, should: expose install metadata without offline behavior", async ({
    context,
    page,
    request,
  }) => {
    await test.step("verify the manifest contract", async () => {
      const response = await request.get("/manifest.webmanifest")

      expect(response.status()).toEqual(200)
      expect(response.headers()["content-type"]).toContain(
        "application/manifest+json",
      )
      expect(await response.json()).toMatchObject({
        background_color: "#faf9f7",
        display: "standalone",
        icons: expect.arrayContaining(
          expectedIcons.map((icon) => expect.objectContaining(icon)),
        ),
        lang: "en",
        name: "Personal App",
        scope: "/",
        short_name: "Personal",
        start_url: "/",
        theme_color: "#faf9f7",
      })
    })

    await test.step("verify install icons and dimensions", async () => {
      await page.goto("/")

      for (const icon of [
        ...expectedIcons,
        { sizes: "180x180", src: "/apple-touch-icon.png" },
      ]) {
        const response = await request.get(icon.src)
        expect(response.status()).toEqual(200)
        expect(response.headers()["content-type"]).toEqual("image/png")

        const [width, height] = icon.sizes.split("x").map(Number)
        const dimensions = await page.evaluate(
          ({ src }) =>
            new Promise<{ height: number; width: number }>(
              (resolve, reject) => {
                const image = new Image()
                image.onload = () =>
                  resolve({
                    height: image.naturalHeight,
                    width: image.naturalWidth,
                  })
                image.onerror = () => reject(new Error(`Unable to load ${src}`))
                image.src = src
              },
            ),
          icon,
        )

        expect(dimensions).toEqual({ height, width })
      }
    })

    await test.step("verify document metadata and responsive rendering", async () => {
      await page.setViewportSize({ height: 844, width: 390 })
      await page.goto("/")

      await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
        "href",
        "/manifest.webmanifest",
      )
      await expect(
        page.locator('link[rel="apple-touch-icon"]'),
      ).toHaveAttribute("href", "/apple-touch-icon.png")
      await expect(
        page.locator('meta[name="application-name"]'),
      ).toHaveAttribute("content", "Personal App")
      await expect(
        page.locator('meta[name="apple-mobile-web-app-capable"]'),
      ).toHaveAttribute("content", "yes")
      await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2)

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(hasHorizontalOverflow).toBe(false)

      const accessibility = await new AxeBuilder({ page }).analyze()
      expect(accessibility.violations).toEqual([])
    })

    await test.step("verify no service worker or application cache exists", async () => {
      const offlineState = await page.evaluate(async () => ({
        cacheKeys: await caches.keys(),
        registrationCount: (await navigator.serviceWorker.getRegistrations())
          .length,
      }))

      expect(offlineState.cacheKeys).toEqual([])
      expect(offlineState.registrationCount).toEqual(0)

      await context.setOffline(true)
      await expect(page.goto("/auth/signin?offline-check=1")).rejects.toThrow()
      await context.setOffline(false)
    })
  })
})
