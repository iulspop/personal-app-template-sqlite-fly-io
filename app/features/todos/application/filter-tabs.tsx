import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { TodoFilter } from "../domain/todos-domain";
import { cn } from "~/lib/utils";

const filters: TodoFilter[] = ["all", "active", "completed"];

export function FilterTabsComponent({
  currentFilter,
}: {
  currentFilter: TodoFilter;
}) {
  const { t } = useTranslation("todos");

  return (
    <nav aria-label={t("filterLabel")} className="mb-6 flex gap-2">
      {filters.map((filter) => (
        <Link
          aria-current={filter === currentFilter ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-1 text-sm",
            filter === currentFilter
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
          key={filter}
          to={`/?filter=${filter}`}
        >
          {t(`filter.${filter}`)}
        </Link>
      ))}
    </nav>
  );
}
