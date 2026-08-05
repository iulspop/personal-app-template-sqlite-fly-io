import { Resend } from "resend"

import { getServerEnv } from "../../../config/server-env.server"

const env = getServerEnv()
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

type MagicLinkEmailParams = {
  code: string
  email: string
  magicLinkUrl: string
}

type VerificationEmailParams = {
  code: string
  email: string
  verificationUrl: string
}

export const logMagicLinkEmail = ({
  code,
  email,
  magicLinkUrl,
}: MagicLinkEmailParams) => {
  console.log(`[Auth] Magic link for ${email}:`)
  console.log(`  Code: ${code}`)
  console.log(`  Link: ${magicLinkUrl}`)
}

export const logVerificationEmail = ({
  code,
  email,
  verificationUrl,
}: VerificationEmailParams) => {
  console.log(`[Auth] Email verification for ${email}:`)
  console.log(`  Code: ${code}`)
  console.log(`  Link: ${verificationUrl}`)
}

/**
 * Sends a magic-link email with a 6-digit code.
 * Logs the code in development and logs an error when RESEND_API_KEY is not set.
 *
 * @param params - The email recipient, code, and magic link URL.
 */
export async function sendMagicLinkEmail(params: MagicLinkEmailParams) {
  if (env.NODE_ENV === "development") {
    logMagicLinkEmail(params)
    return
  }

  if (!resend) {
    console.error(
      "[Auth] RESEND_API_KEY is not configured; email was not sent.",
    )
    return
  }

  const { code, email, magicLinkUrl } = params

  await resend.emails.send({
    from: env.EMAIL_FROM,
    html: `<p>Your login code is: <strong>${code}</strong></p><p>Or click this link: <a href="${magicLinkUrl}">${magicLinkUrl}</a></p>`,
    subject: "Your login code",
    to: email,
  })
}

/**
 * Sends an email-verification email with a 6-digit code.
 * Logs the code in development and logs an error when RESEND_API_KEY is not set.
 *
 * @param params - The email recipient, code, and verification URL.
 */
export async function sendVerificationEmail(params: VerificationEmailParams) {
  if (env.NODE_ENV === "development") {
    logVerificationEmail(params)
    return
  }

  if (!resend) {
    console.error(
      "[Auth] RESEND_API_KEY is not configured; email was not sent.",
    )
    return
  }

  const { code, email, verificationUrl } = params

  await resend.emails.send({
    from: env.EMAIL_FROM,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>Or click this link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    subject: "Verify your email",
    to: email,
  })
}
