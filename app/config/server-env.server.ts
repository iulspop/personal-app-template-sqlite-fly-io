import { join } from "node:path"

import type {
  RedactedEnvIssue,
  RuntimeMode,
  ServerEnv,
  ServerEnvSource,
} from "./server-env"
import {
  createServerEnvSchema,
  redactEnvIssues,
  runtimeModes,
} from "./server-env"

export type ParsedServerEnv = ServerEnv & {
  ALLOW_INDEXING: boolean
  CHAT_ATTACHMENT_DIRECTORY: string
  DATABASE_URL: string
  EMAIL_FROM: string
  NODE_ENV: RuntimeMode
  SESSION_SECRET: string
}

export class ServerEnvValidationError extends Error {
  readonly issues: RedactedEnvIssue[]

  constructor(issues: RedactedEnvIssue[]) {
    const names = [...new Set(issues.map(({ path }) => path))].join(", ")
    super(`Invalid server environment configuration: ${names}`)
    this.name = "ServerEnvValidationError"
    this.issues = issues
  }
}

let cachedServerEnv: ParsedServerEnv | undefined

export function parseServerEnv(
  source: ServerEnvSource,
  mode: RuntimeMode,
): ParsedServerEnv {
  const result = createServerEnvSchema(mode).safeParse(source)
  if (!result.success) {
    throw new ServerEnvValidationError(redactEnvIssues(result.error))
  }

  return {
    ...result.data,
    ALLOW_INDEXING: result.data.ALLOW_INDEXING ?? true,
    CHAT_ATTACHMENT_DIRECTORY:
      result.data.CHAT_ATTACHMENT_DIRECTORY ??
      (mode === "production"
        ? "/data/chat-attachments"
        : join(process.cwd(), ".data/chat-attachments")),
    DATABASE_URL: result.data.DATABASE_URL ?? "file:./prisma/dev.db",
    EMAIL_FROM: result.data.EMAIL_FROM ?? "noreply@example.com",
    NODE_ENV: mode,
    SESSION_SECRET: result.data.SESSION_SECRET ?? "default-secret",
  }
}

export function getServerEnv(): ParsedServerEnv {
  if (cachedServerEnv) return cachedServerEnv

  const configuredMode = process.env.NODE_ENV
  const mode = runtimeModes.includes(configuredMode as RuntimeMode)
    ? (configuredMode as RuntimeMode)
    : "development"

  cachedServerEnv = parseServerEnv({ ...process.env, NODE_ENV: mode }, mode)
  return cachedServerEnv
}

export function resetServerEnvCacheForTests() {
  cachedServerEnv = undefined
}
