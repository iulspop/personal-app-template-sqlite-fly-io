import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { content: "Welcome to React Router!", name: "description" },
  ];
}

export default function Home() {
  return <Welcome />;
}
