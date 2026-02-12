import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  argTypes: {
    size: { control: "select", options: ["default", "sm"] },
  },
  component: Card,
  title: "UI/Card",
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>A short description of the card.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Cancel</Button>
          <Button className="ml-2">Save</Button>
        </CardFooter>
      </>
    ),
  },
};

export const Small: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Compact Card</CardTitle>
          <CardDescription>Smaller padding variant.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Less spacing for tighter layouts.</p>
        </CardContent>
      </>
    ),
    size: "sm",
  },
};

export const WithAction: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your preferences.</CardDescription>
          <CardAction>
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Content with an action button in the header.</p>
        </CardContent>
      </>
    ),
  },
};
