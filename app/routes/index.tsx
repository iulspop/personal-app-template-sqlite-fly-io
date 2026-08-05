import type { Route } from "./+types/index"
import HomeContentComponent from "~/composition/generated/home-content"
import {
  action as homeAction,
  loader as homeLoader,
} from "~/composition/generated/home-content.server"

export const loader = (args: Route.LoaderArgs) => homeLoader(args)
export const action = (args: Route.ActionArgs) => homeAction(args)
export const meta = ({ loaderData }: Route.MetaArgs) => [
  { title: loaderData?.pageTitle },
]

export default function IndexRoute(props: Route.ComponentProps) {
  return <HomeContentComponent {...props} />
}
