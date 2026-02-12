import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  addons: [],
  framework: "@storybook/react-vite",
  stories: ["../app/**/*.stories.@(ts|tsx)"],
};

export default config;
