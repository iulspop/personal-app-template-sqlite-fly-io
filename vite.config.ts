import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig((config) => ({
  plugins: [
    tailwindcss(),
    !process.env.VITEST && !process.env.STORYBOOK && reactRouter(),
    !process.env.VITEST &&
      !process.env.STORYBOOK &&
      sentryReactRouter(
        {
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
        },
        config,
      ),
    tsconfigPaths(),
    devtoolsJson(),
  ],
  test: {
    projects: [
      {
        extends: true,
        test: {
          include: ["app/**/*.test.ts"],
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
}));
