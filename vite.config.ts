import { reactRouter } from "@react-router/dev/vite"
import { sentryReactRouter } from "@sentry/react-router"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import type { ConfigEnv } from "vite"
import devtoolsJson from "vite-plugin-devtools-json"

export default async function viteConfig(config: ConfigEnv) {
  const sentryBuildEnabled = Boolean(
    process.env.SENTRY_AUTH_TOKEN &&
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT,
  )
  const sentryConfig = {
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    sourcemaps: {
      disable: !sentryBuildEnabled,
      filesToDeleteAfterUpload: ["./build/**/*.map"],
    },
  }

  return {
    optimizeDeps: {
      include: ["react-redux", "redux", "redux-saga", "redux-saga/effects"],
    },
    plugins: [
      vanillaExtractPlugin(),
      !process.env.VITEST && !process.env.STORYBOOK && reactRouter(),
      sentryBuildEnabled && !process.env.VITEST && !process.env.STORYBOOK
        ? await sentryReactRouter(sentryConfig, config)
        : undefined,
      devtoolsJson(),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      projects: [
        {
          extends: true,
          test: {
            include: ["app/**/*.test.ts", "scripts/**/*.test.ts"],
            name: "unit-tests",
          },
        },
        {
          extends: true,
          test: {
            fileParallelism: false,
            include: ["app/**/*.spec.ts"],
            name: "integration-tests",
            setupFiles: ["app/test/setup-server-test-environment.ts"],
          },
        },
        {
          extends: true,
          test: {
            environment: "happy-dom",
            include: ["app/**/*.test.tsx"],
            name: "react-happy-dom-tests",
            setupFiles: ["app/test/setup-browser-test-environment.ts"],
          },
        },
      ],
    },
  }
}
