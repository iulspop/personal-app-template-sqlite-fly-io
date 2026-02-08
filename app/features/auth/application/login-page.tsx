import { useTranslation } from "react-i18next";
import { Form } from "react-router";

import { SEND_MAGIC_LINK_INTENT } from "../domain/auth-constants";
import type { UserValidationError } from "~/features/users/domain/users-domain";
import {
  isUserValidationError,
  userValidationErrorToI18nKey,
} from "~/features/users/domain/users-domain";

type LoginPageActionData =
  | { error: string; success: false }
  | { error: null; success: true }
  | undefined;

export function LoginPageComponent({
  actionData,
}: {
  actionData?: LoginPageActionData;
}) {
  const { t } = useTranslation("auth", { keyPrefix: "login" });
  const { t: tValidation } = useTranslation("auth");

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
        {t("title")}
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        {t("description")}
      </p>

      <Form className="space-y-4" method="post">
        <div>
          <input
            autoComplete="email"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
        </div>
        <button
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          name="intent"
          type="submit"
          value={SEND_MAGIC_LINK_INTENT}
        >
          {t("submit")}
        </button>
        {actionData?.success === false && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {isUserValidationError(actionData.error)
              ? tValidation(
                  userValidationErrorToI18nKey(
                    actionData.error as UserValidationError,
                  ),
                )
              : tValidation(`validation.${actionData.error}` as never)}
          </p>
        )}
      </Form>
    </main>
  );
}
