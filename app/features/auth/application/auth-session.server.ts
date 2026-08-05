import { createCookieSessionStorage, redirect } from "react-router"

import { getServerEnv } from "../../../config/server-env.server"
import { SESSION_EXPIRY_DAYS } from "../domain/auth-constants"
import { computeSessionExpiry, isSessionExpired } from "../domain/auth-domain"
import {
  deleteSessionFromDatabaseById,
  retrieveSessionWithUserFromDatabaseById,
  saveSessionToDatabase,
} from "../infrastructure/sessions-model.server"

const SESSION_KEY = "sessionId"
const { NODE_ENV: mode, SESSION_SECRET: sessionSecret } = getServerEnv()

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    httpOnly: true,
    name: "__session",
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: mode === "production",
  },
})

/**
 * Reads the session ID from the request cookie.
 */
export const getSessionId = async (request: Request) => {
  const cookieSession = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  )
  return cookieSession.get(SESSION_KEY) as string | undefined
}

/**
 * Resolves the authenticated user's ID from the session cookie.
 * Returns null if there is no session or if it has expired.
 */
export const getUserId = async (request: Request): Promise<string | null> => {
  const sessionId = await getSessionId(request)
  if (!sessionId) return null

  const session = await retrieveSessionWithUserFromDatabaseById(sessionId)
  if (!session) return null

  if (isSessionExpired(session.expirationDate)) {
    await deleteSessionFromDatabaseById(session.id).catch(() => {})
    return null
  }

  return session.userId
}

/**
 * Requires an authenticated user. Throws a redirect to /auth/signin if not authenticated.
 */
export const requireUserId = async (request: Request): Promise<string> => {
  const userId = await getUserId(request)
  if (!userId) throw redirect("/auth/signin")
  return userId
}

/**
 * Requires the request to be anonymous (no active session).
 * Throws a redirect to / if the user is already authenticated.
 */
export const requireAnonymous = async (request: Request): Promise<void> => {
  const userId = await getUserId(request)
  if (userId) throw redirect("/")
}

/**
 * Creates a DB-backed session and returns the Set-Cookie header value.
 */
export const createUserSession = async (userId: string): Promise<string> => {
  const dbSession = await saveSessionToDatabase({
    expirationDate: computeSessionExpiry(SESSION_EXPIRY_DAYS),
    user: { connect: { id: userId } },
  })

  const cookieSession = await sessionStorage.getSession()
  cookieSession.set(SESSION_KEY, dbSession.id)
  return sessionStorage.commitSession(cookieSession)
}

/**
 * Destroys the DB session and cookie session. Returns the Set-Cookie header value.
 */
export const destroyUserSession = async (request: Request): Promise<string> => {
  const sessionId = await getSessionId(request)
  if (sessionId) {
    await deleteSessionFromDatabaseById(sessionId).catch(() => {})
  }

  const cookieSession = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  )
  return sessionStorage.destroySession(cookieSession)
}
