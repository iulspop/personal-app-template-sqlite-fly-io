// ─── Types ───────────────────────────────────────────────────────────────────

export type Result<T, E> =
  | { error: E; success: false }
  | { data: T; success: true };

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * Checks whether a session has expired.
 */
export const isSessionExpired = (
  expirationDate: Date,
  now = new Date(),
): boolean => expirationDate.getTime() <= now.getTime();

/**
 * Computes a session expiration date.
 */
export const computeSessionExpiry = (
  daysFromNow: number,
  now = new Date(),
): Date => new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);

/**
 * Computes a verification expiration date.
 */
export const computeVerificationExpiry = (
  minutesFromNow: number,
  now = new Date(),
): Date => new Date(now.getTime() + minutesFromNow * 60 * 1000);

/**
 * Builds a magic-link callback URL.
 */
export const buildMagicLinkUrl = ({
  baseUrl,
  code,
  target,
  type,
}: {
  baseUrl: string;
  code: string;
  target: string;
  type: string;
}): string => {
  const url = new URL("/auth/callback", baseUrl);
  url.searchParams.set("type", type);
  url.searchParams.set("target", target);
  url.searchParams.set("code", code);
  return url.toString();
};
