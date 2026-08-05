// biome-ignore-all assist/source/organizeImports: Generated feature slots require stable import boundaries.
// FEATURE_SLOT_BEGIN:settingsLinks:founderChatSettingsImports
import { retrieveOwnerStatusForUser } from "~/features/chat/infrastructure/chat-model.server"
import { isOwnerChatSmsConfigured } from "~/features/chat/infrastructure/chat-sms.server"
// FEATURE_SLOT_END:settingsLinks:founderChatSettingsImports
import type { ServerEnv } from "~/config/server-env"

export type SettingsFeatureData = Record<string, unknown> & {
  // FEATURE_SLOT_BEGIN:settingsLinks:founderChatSettingsData
  chatEmailConfigured?: boolean
  chatSmsConfigured?: boolean
  isOwner?: boolean
  // FEATURE_SLOT_END:settingsLinks:founderChatSettingsData
}

export const loadSettingsFeatureData = async ({
  env,
  userId,
}: {
  env: ServerEnv
  userId: string
}): Promise<SettingsFeatureData> => {
  const featureData: SettingsFeatureData = {}
  // FEATURE_SLOT_BEGIN:settingsLinks:founderChatSettingsLoader
  Object.assign(featureData, {
    chatEmailConfigured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
    chatSmsConfigured: isOwnerChatSmsConfigured(env.OWNER_PHONE_NUMBER),
    isOwner: Boolean(await retrieveOwnerStatusForUser(userId)),
  })
  // FEATURE_SLOT_END:settingsLinks:founderChatSettingsLoader
  return featureData
}
