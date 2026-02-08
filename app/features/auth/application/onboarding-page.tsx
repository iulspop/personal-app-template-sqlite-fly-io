import { useTranslation } from "react-i18next";
import { Form } from "react-router";

import { ONBOARD_INTENT } from "../domain/auth-constants";
import { Button } from "~/components/ui/button";
import { FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import type { UserValidationError } from "~/features/users/domain/users-domain";
import {
  isUserValidationError,
  userValidationErrorToI18nKey,
} from "~/features/users/domain/users-domain";

type OnboardingPageActionData =
  | { error: string; success: false }
  | { error: null; success: true }
  | undefined;

export function OnboardingPageComponent({
  actionData,
  email,
}: {
  actionData?: OnboardingPageActionData;
  email: string;
}) {
  const { t } = useTranslation("auth", { keyPrefix: "onboarding" });
  const { t: tValidation } = useTranslation("auth");

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mb-8 text-muted-foreground">{t("description")}</p>

      <Form className="space-y-4" method="post">
        <input name="email" type="hidden" value={email} />
        <div>
          <Input
            autoComplete="name"
            name="name"
            placeholder={t("namePlaceholder")}
            type="text"
          />
        </div>
        <Button
          className="w-full"
          name="intent"
          type="submit"
          value={ONBOARD_INTENT}
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
