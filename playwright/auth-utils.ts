import { generateTOTP } from "@epic-web/totp"
import type { Page } from "@playwright/test"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

import { PrismaClient } from "../generated/prisma/client"

const createPrisma = () => {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/e2e.db",
  })
  return new PrismaClient({ adapter })
}

/**
 * Reads the verification record from the DB and generates the current OTP code.
 * Used in e2e tests to bypass real email delivery.
 */
export async function getVerificationCode(email: string): Promise<string> {
  const prisma = createPrisma()

  try {
    const verification = await prisma.verification.findUnique({
      where: { type_target: { target: email, type: "login" } },
    })

    if (!verification) throw new Error(`No verification found for ${email}`)

    const { otp } = await generateTOTP({
      algorithm: verification.algorithm,
      charSet: verification.charSet,
      digits: verification.digits,
      period: verification.period,
      secret: verification.secret,
    })

    return otp
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Creates a test user directly in the DB. Returns the user details.
 */
export async function setupTestUser(overrides: { email?: string } = {}) {
  const prisma = createPrisma()
  const email = overrides.email ?? `test-${Date.now()}@example.com`

  try {
    const user = await prisma.user.upsert({
      create: { email, emailVerifiedAt: new Date() },
      update: { emailVerifiedAt: new Date() },
      where: { email },
    })
    return { email: user.email, id: user.id }
  } finally {
    await prisma.$disconnect()
  }
}

// FEATURE_SLOT_BEGIN:testHelpers:founderChatE2eHelpers
export async function setupChatOwner(email: string) {
  const prisma = createPrisma()

  try {
    await prisma.ownerClaim.deleteMany()
    const owner = await prisma.user.upsert({
      create: { email, emailVerifiedAt: new Date() },
      update: { emailVerifiedAt: new Date() },
      where: { email },
    })
    await prisma.ownerClaim.create({
      data: { singletonKey: 1, userId: owner.id },
    })
    return { email: owner.email, id: owner.id }
  } finally {
    await prisma.$disconnect()
  }
}

export async function deleteAllChatData() {
  const prisma = createPrisma()

  try {
    await prisma.chatTypingState.deleteMany()
    await prisma.chatNotification.deleteMany()
    await prisma.chatAttachment.deleteMany()
    await prisma.chatMessage.deleteMany()
    await prisma.chatConversation.deleteMany()
    await prisma.ownerClaim.deleteMany()
  } finally {
    await prisma.$disconnect()
  }
}
// FEATURE_SLOT_END:testHelpers:founderChatE2eHelpers

// FEATURE_SLOT_BEGIN:testHelpers:todosE2eHelpers
/**
 * Deletes all todos from the database.
 * Used to ensure test isolation since todos are not user-scoped.
 */
export async function deleteAllTodos() {
  const prisma = createPrisma()

  try {
    await prisma.todo.deleteMany()
  } finally {
    await prisma.$disconnect()
  }
}
// FEATURE_SLOT_END:testHelpers:todosE2eHelpers

/**
 * Creates a test user + session and sets the session cookie on the page.
 * Use this to authenticate before a test without going through the login flow.
 */
export async function loginAsTestUser(
  page: Page,
  overrides: { email?: string } = {},
) {
  const prisma = createPrisma()
  const email = overrides.email ?? `login-${Date.now()}@example.com`

  try {
    const user = await prisma.user.upsert({
      create: { email },
      update: {},
      where: { email },
    })

    const session = await prisma.session.create({
      data: {
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    })

    // Build the session cookie using the same cookie session storage logic.
    // We import the server module to use createCookieSessionStorage.
    const { createCookieSessionStorage } = await import("react-router")
    const sessionStorage = createCookieSessionStorage({
      cookie: {
        httpOnly: true,
        name: "__session",
        path: "/",
        sameSite: "lax",
        secrets: [process.env.SESSION_SECRET ?? "default-secret"],
        secure: false,
      },
    })

    const cookieSession = await sessionStorage.getSession()
    cookieSession.set("sessionId", session.id)
    const setCookieHeader = await sessionStorage.commitSession(cookieSession)

    // Parse Set-Cookie header and add to browser context
    const cookieValue =
      setCookieHeader.split(";")[0]?.split("=").slice(1).join("=") ?? ""
    await page.context().addCookies([
      {
        domain: "localhost",
        name: "__session",
        path: "/",
        value: cookieValue,
      },
    ])

    return { email: user.email, id: user.id }
  } finally {
    await prisma.$disconnect()
  }
}
