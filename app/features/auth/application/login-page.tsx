import { Img } from "openimg/react";
import { useTranslation } from "react-i18next";
import { Form } from "react-router";

import { SEND_MAGIC_LINK_INTENT } from "../domain/auth-constants";
import { Button } from "~/components/ui/button";
import { FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
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
      <Img
        alt=""
        className="mb-8 size-12 rounded-lg"
        height={48}
        src="/images/logo.png"
        width={48}
      />
      <h1 className="mb-2 text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mb-8 text-muted-foreground">{t("description")}</p>

      <Form className="space-y-4" method="post">
        <div>
          <Input
            autoComplete="email"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
        </div>
        <Button
          className="w-full"
          name="intent"
          type="submit"
          value={SEND_MAGIC_LINK_INTENT}
        >
          {t("submit")}
        </Button>
        {actionData?.success === false && (
          <FieldError>
            {isUserValidationError(actionData.error)
              ? tValidation(
                  userValidationErrorToI18nKey(
                    actionData.error as UserValidationError,
                  ),
                )
              : tValidation(`validation.${actionData.error}` as never)}
          </FieldError>
        )}
      </Form>
    </main>
  );
}
