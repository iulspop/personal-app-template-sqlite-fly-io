import type { Route } from "./+types/index";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { todosAction } from "~/features/todos/application/todos-action.server";
import { TodosPageComponent } from "~/features/todos/application/todos-page";
import { retrieveAllTodosFromDatabase } from "~/features/todos/infrastructure/todos-model.server";

export async function loader({ context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  return {
    pageTitle: i18n.t("todos:pageTitle"),
    todos: await retrieveAllTodosFromDatabase(),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return await todosAction(args);
}

export default function TodosRoute({ loaderData }: Route.ComponentProps) {
  return <TodosPageComponent todos={loaderData.todos} />;
}
