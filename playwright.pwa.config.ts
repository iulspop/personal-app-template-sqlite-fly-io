import { defineConfig, devices } from "@playwright/test"

const port = 5260
const databaseUrl = "file:./prisma/e2e.db"

export default defineConfig({
  forbidOnly: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "html",
  retries: 0,
  testDir: "./playwright/e2e",
  testMatch: "pwa-install.e2e.ts",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm start",
    env: {
      APP_URL: `http://localhost:${port}`,
      DATABASE_URL: databaseUrl,
      NODE_ENV: "production",
      PORT: String(port),
      SESSION_SECRET: "pwa-install-test-session-secret",
      TZ: "UTC",
    },
    port,
    reuseExistingServer: false,
  },
  workers: 1,
})
