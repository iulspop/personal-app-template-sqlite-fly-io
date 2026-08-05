import { z } from "zod"

export const runtimeModes = ["development", "test", "production"] as const

export type RuntimeMode = (typeof runtimeModes)[number]

export type RedactedEnvIssue = {
  code: string
  message: string
  path: string
}

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
)

const optionalUrl = optionalString.refine(
  (value) => value === undefined || URL.canParse(value),
  "Must be a valid URL",
)

const optionalHttpUrl = optionalString.refine((value) => {
  if (value === undefined || !URL.canParse(value)) return value === undefined
  return ["http:", "https:"].includes(new URL(value).protocol)
}, "Must be an HTTP or HTTPS URL")

const optionalBoolean = z.preprocess(
  (value) => (typeof value === "string" ? value.toLowerCase() : value),
  z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
)

const optionalSampleRate = optionalString
  .transform((value) => (value === undefined ? undefined : Number(value)))
  .refine(
    (value) =>
      value === undefined ||
      (Number.isFinite(value) && value >= 0 && value <= 1),
    "Must be a number between 0 and 1",
  )

const baseServerEnvSchema = z.object({
  ALLOW_INDEXING: optionalBoolean,
  APP_URL: optionalHttpUrl,
  // FEATURE_SLOT_BEGIN:serverEnvExtensions:founderChatEnvFields
  CHAT_ATTACHMENT_DIRECTORY: optionalString,
  // FEATURE_SLOT_END:serverEnvExtensions:founderChatEnvFields
  DATABASE_URL: optionalUrl,
  EMAIL_FROM: optionalString,
  NODE_ENV: z.enum(runtimeModes).optional(),
  // FEATURE_SLOT_BEGIN:serverEnvExtensions:founderChatOwnerEnvFields
  OWNER_EMAIL_ALLOWLIST: optionalString,
  OWNER_PHONE_NUMBER: optionalString,
  // FEATURE_SLOT_END:serverEnvExtensions:founderChatOwnerEnvFields
  POSTHOG_API_HOST: optionalHttpUrl,
  POSTHOG_API_KEY: optionalString,
  RESEND_API_KEY: optionalString,
  SENTRY_AUTH_TOKEN: optionalString,
  SENTRY_DSN: optionalHttpUrl,
  SENTRY_ENVIRONMENT: optionalString,
  SENTRY_ORG: optionalString,
  SENTRY_PROJECT: optionalString,
  SENTRY_RELEASE: optionalString,
  SENTRY_TRACES_SAMPLE_RATE: optionalSampleRate,
  SESSION_SECRET: optionalString,
  // FEATURE_SLOT_BEGIN:serverEnvExtensions:founderChatTwilioFields
  TWILIO_ACCOUNT_SID: optionalString,
  TWILIO_AUTH_TOKEN: optionalString,
  TWILIO_FROM_NUMBER: optionalString,
  // FEATURE_SLOT_END:serverEnvExtensions:founderChatTwilioFields
})

export type ServerEnv = z.output<typeof baseServerEnvSchema>
export type ServerEnvSource = Partial<
  Record<keyof z.input<typeof baseServerEnvSchema>, unknown>
>

function addRequiredIssue(
  context: z.RefinementCtx,
  source: ServerEnv,
  name: keyof ServerEnv,
  message: string,
) {
  if (source[name] !== undefined) return

  context.addIssue({
    code: "custom",
    message,
    path: [name],
  })
}

export function createServerEnvSchema(mode: RuntimeMode) {
  return baseServerEnvSchema.superRefine((source, context) => {
    if (mode === "production") {
      addRequiredIssue(context, source, "APP_URL", "Required in production")
      addRequiredIssue(
        context,
        source,
        "DATABASE_URL",
        "Required in production",
      )
      addRequiredIssue(
        context,
        source,
        "SESSION_SECRET",
        "Required in production",
      )
    }

    const resendConfigured = source.RESEND_API_KEY !== undefined
    if (resendConfigured) {
      addRequiredIssue(
        context,
        source,
        "EMAIL_FROM",
        "Required when Resend is configured",
      )
    }

    // FEATURE_SLOT_BEGIN:serverEnvExtensions:founderChatTwilioValidation
    const twilioValues = [
      source.TWILIO_ACCOUNT_SID,
      source.TWILIO_AUTH_TOKEN,
      source.TWILIO_FROM_NUMBER,
    ]
    const configuredTwilioValues = twilioValues.filter(
      (value) => value !== undefined,
    ).length

    if (
      configuredTwilioValues > 0 &&
      configuredTwilioValues < twilioValues.length
    ) {
      for (const name of [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_FROM_NUMBER",
      ] as const) {
        if (source[name] === undefined) {
          context.addIssue({
            code: "custom",
            message: "Required when Twilio is partially configured",
            path: [name],
          })
        }
      }
    }
    // FEATURE_SLOT_END:serverEnvExtensions:founderChatTwilioValidation
  })
}

export function redactEnvIssues(error: z.ZodError): RedactedEnvIssue[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.join("."),
  }))
}
