import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tailwindcss(),
    !process.env.VITEST && reactRouter(),
    tsconfigPaths(),
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
});
