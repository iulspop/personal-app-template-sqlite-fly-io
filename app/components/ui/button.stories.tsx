import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconTrash } from "@tabler/icons-react";

import { Button } from "./button";

const meta = {
  argTypes: {
    disabled: { control: "boolean" },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "xs", "icon", "icon-sm", "icon-xs"],
    },
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "ghost",
        "link",
        "outline",
      ],
    },
  },
  component: Button,
  title: "UI/Button",
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Button" },
};

export const Secondary: Story = {
  args: { children: "Secondary", variant: "secondary" },
};

export const Destructive: Story = {
  args: { children: "Delete", variant: "destructive" },
};

export const Ghost: Story = {
  args: { children: "Ghost", variant: "ghost" },
};

export const Link: Story = {
  args: { children: "Link", variant: "link" },
};

export const Outline: Story = {
  args: { children: "Outline", variant: "outline" },
};

export const Small: Story = {
  args: { children: "Small", size: "sm" },
};

export const Large: Story = {
  args: { children: "Large", size: "lg" },
};

export const WithIcon: Story = {
  args: { children: <IconTrash />, size: "icon", variant: "destructive" },
};

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
};
