import type { ServerEnvSource } from "~/config/server-env"

export type FeatureIntegrationCheck = readonly [
  id: string,
  names: readonly (keyof ServerEnvSource)[],
  label: string,
]

export const featureIntegrationChecks: readonly FeatureIntegrationCheck[] = [
  // FEATURE_SLOT_BEGIN:serverEnvExtensions:founderChatDoctorIntegrations
  ["owner-chat", ["OWNER_EMAIL_ALLOWLIST"], "Owner chat allowlist"],
  [
    "twilio",
    [
      "OWNER_PHONE_NUMBER",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_FROM_NUMBER",
    ],
    "Twilio SMS",
  ],
  // FEATURE_SLOT_END:serverEnvExtensions:founderChatDoctorIntegrations
]
