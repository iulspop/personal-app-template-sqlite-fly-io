import { data, redirect } from "react-router"
import { match } from "ts-pattern"

import { getServerEnv } from "../../../config/server-env.server"
import {
  SEND_MAGIC_LINK_INTENT,
  VERIFICATION_EXPIRY_MINUTES,
  VERIFICATION_TYPE_LOGIN,
  VERIFY_CODE_INTENT,
} from "../domain/auth-constants"
import {
  buildMagicLinkUrl,
  computeVerificationExpiry,
  isSessionExpired,
} from "../domain/auth-domain"
import { sendMagicLinkEmail } from "../infrastructure/email.server"
import {
  generateVerificationTOTP,
  verifyVerificationTOTP,
} from "../infrastructure/totp.server"
import {
  deleteVerificationFromDatabaseByTypeAndTarget,
  retrieveVerificationFromDatabaseByTypeAndTarget,
  saveVerificationToDatabase,
} from "../infrastructure/verifications-model.server"
import { authActionSchema } from "./auth-schemas"
import { createUserSession } from "./auth-session.server"
import { validateEmail } from "~/features/users/domain/users-domain"
import {
  retrieveUserFromDatabaseByEmail,
  saveUserToDatabase,
  updateUserInDatabaseById,
} from "~/features/users/infrastructure/users-model.server"

export const authAction = async ({ request }: { request: Request }) => {
  const formData = await request.formData()
  const parsed = authActionSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success)
    return data(
      { error: "Invalid form data", success: false as const },
      { status: 400 },
    )

  return match(parsed.data)
    .with({ intent: SEND_MAGIC_LINK_INTENT }, async ({ email }) => {
      const emailResult = validateEmail(email)
      if (!emailResult.success)
        return data(
          { error: emailResult.error, success: false as const },
          { status: 400 },
        )

      const { algorithm, charSet, digits, otp, period, secret } =
        await generateVerificationTOTP()

      await saveVerificationToDatabase({
        algorithm,
        charSet,
        digits,
        expiresAt: computeVerificationExpiry(VERIFICATION_EXPIRY_MINUTES),
        period,
        secret,
        target: emailResult.data,
        type: VERIFICATION_TYPE_LOGIN,
      })

      const baseUrl = getServerEnv().APP_URL || new URL(request.url).origin
      const magicLinkUrl = buildMagicLinkUrl({
        baseUrl,
        code: otp,
        target: emailResult.data,
        type: VERIFICATION_TYPE_LOGIN,
      })

      await sendMagicLinkEmail({
        code: otp,
        email: emailResult.data,
        magicLinkUrl,
      })

      const searchParams = new URLSearchParams({
        target: emailResult.data,
        type: VERIFICATION_TYPE_LOGIN,
      })
      throw redirect(`/verify?${searchParams.toString()}`)
    })
    .with({ intent: VERIFY_CODE_INTENT }, async ({ code, target, type }) => {
      const verification =
        await retrieveVerificationFromDatabaseByTypeAndTarget({
          target,
          type,
        })

      if (!verification)
        return data(
          { error: "invalidCode", success: false as const },
          { status: 400 },
        )

      if (isSessionExpired(verification.expiresAt))
        return data(
          { error: "codeExpired", success: false as const },
          { status: 400 },
        )

      const verifyResult = await verifyVerificationTOTP({
        algorithm: verification.algorithm,
        charSet: verification.charSet,
        digits: verification.digits,
        otp: code,
        period: verification.period,
        secret: verification.secret,
      })

      if (!verifyResult)
        return data(
          { error: "invalidCode", success: false as const },
          { status: 400 },
        )

      await deleteVerificationFromDatabaseByTypeAndTarget({ target, type })

      const existingUser = await retrieveUserFromDatabaseByEmail(target)
      const user = existingUser
        ? await updateUserInDatabaseById({
            emailVerifiedAt: new Date(),
            id: existingUser.id,
          })
        : await saveUserToDatabase({
            email: target,
            emailVerifiedAt: new Date(),
          })
      const setCookie = await createUserSession(user.id)

      throw redirect("/", {
        headers: { "Set-Cookie": setCookie },
      })
    })
    .exhaustive()
}
