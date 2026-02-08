import { data, redirect } from "react-router";
import { match } from "ts-pattern";

import {
  ONBOARD_INTENT,
  SEND_MAGIC_LINK_INTENT,
  VERIFICATION_EXPIRY_MINUTES,
  VERIFICATION_TYPE_LOGIN,
  VERIFY_CODE_INTENT,
} from "../domain/auth-constants";
import {
  buildMagicLinkUrl,
  computeVerificationExpiry,
  isSessionExpired,
} from "../domain/auth-domain";
import { sendMagicLinkEmail } from "../infrastructure/email.server";
import {
  generateVerificationTOTP,
  verifyVerificationTOTP,
} from "../infrastructure/totp.server";
import {
  deleteVerificationFromDatabaseByTypeAndTarget,
  retrieveVerificationFromDatabaseByTypeAndTarget,
  saveVerificationToDatabase,
} from "../infrastructure/verifications-model.server";
import { authActionSchema } from "./auth-schemas";
import { createUserSession } from "./auth-session.server";
import {
  validateEmail,
  validateName,
} from "~/features/users/domain/users-domain";
import {
  retrieveUserFromDatabaseByEmail,
  saveUserToDatabase,
} from "~/features/users/infrastructure/users-model.server";

export const authAction = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const parsed = authActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success)
    return data(
      { error: "Invalid form data", success: false as const },
      { status: 400 },
    );

  return match(parsed.data)
    .with({ intent: SEND_MAGIC_LINK_INTENT }, async ({ email }) => {
      const emailResult = validateEmail(email);
      if (!emailResult.success)
        return data(
          { error: emailResult.error, success: false as const },
          { status: 400 },
        );

      const { algorithm, charSet, digits, otp, period, secret } =
        await generateVerificationTOTP();

      await saveVerificationToDatabase({
        algorithm,
        charSet,
        digits,
        expiresAt: computeVerificationExpiry(VERIFICATION_EXPIRY_MINUTES),
        period,
        secret,
        target: emailResult.data,
        type: VERIFICATION_TYPE_LOGIN,
      });

      const baseUrl = new URL(request.url).origin;
      const magicLinkUrl = buildMagicLinkUrl({
        baseUrl,
        code: otp,
        target: emailResult.data,
        type: VERIFICATION_TYPE_LOGIN,
      });

      await sendMagicLinkEmail({
        code: otp,
        email: emailResult.data,
        magicLinkUrl,
      });

      const searchParams = new URLSearchParams({
        target: emailResult.data,
        type: VERIFICATION_TYPE_LOGIN,
      });
      throw redirect(`/verify?${searchParams.toString()}`);
    })
    .with({ intent: VERIFY_CODE_INTENT }, async ({ code, target, type }) => {
      const verification =
        await retrieveVerificationFromDatabaseByTypeAndTarget({
          target,
          type,
        });

      if (!verification)
        return data(
          { error: "invalidCode", success: false as const },
          { status: 400 },
        );

      if (isSessionExpired(verification.expiresAt))
        return data(
          { error: "codeExpired", success: false as const },
          { status: 400 },
        );

      const verifyResult = await verifyVerificationTOTP({
        algorithm: verification.algorithm,
        charSet: verification.charSet,
        digits: verification.digits,
        otp: code,
        period: verification.period,
        secret: verification.secret,
      });

      if (!verifyResult)
        return data(
          { error: "invalidCode", success: false as const },
          { status: 400 },
        );

      await deleteVerificationFromDatabaseByTypeAndTarget({ target, type });

      const existingUser = await retrieveUserFromDatabaseByEmail(target);

      if (existingUser) {
        const setCookie = await createUserSession(existingUser.id);
        throw redirect("/", {
          headers: { "Set-Cookie": setCookie },
        });
      }

      const onboardParams = new URLSearchParams({ email: target });
      throw redirect(`/onboarding?${onboardParams.toString()}`);
    })
    .with({ intent: ONBOARD_INTENT }, async ({ email, name }) => {
      const emailResult = validateEmail(email);
      if (!emailResult.success)
        return data(
          { error: emailResult.error, success: false as const },
          { status: 400 },
        );

      const nameResult = validateName(name);
      if (!nameResult.success)
        return data(
          { error: nameResult.error, success: false as const },
          { status: 400 },
        );

      const existingUser = await retrieveUserFromDatabaseByEmail(
        emailResult.data,
      );
      if (existingUser) {
        const setCookie = await createUserSession(existingUser.id);
        throw redirect("/", {
          headers: { "Set-Cookie": setCookie },
        });
      }

      const user = await saveUserToDatabase({
        email: emailResult.data,
        name: nameResult.data,
      });

      const setCookie = await createUserSession(user.id);
      throw redirect("/", {
        headers: { "Set-Cookie": setCookie },
      });
    })
    .exhaustive();
};
