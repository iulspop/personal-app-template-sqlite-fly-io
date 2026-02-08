// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Discriminated result union. Defined locally so the domain file
 * remains pure (zero imports).
 */
export type Result<T, E> =
  | { error: E; success: false }
  | { data: T; success: true };

export type UserValidationError =
  | "EMAIL_EMPTY"
  | "EMAIL_INVALID"
  | "NAME_EMPTY"
  | "NAME_TOO_LONG";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * Validates and normalises an email address.
 */
export const validateEmail = (
  email: string,
): Result<string, UserValidationError> => {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0) return { error: "EMAIL_EMPTY", success: false };
  if (!EMAIL_REGEX.test(trimmed))
    return { error: "EMAIL_INVALID", success: false };
  return { data: trimmed, success: true };
};

/**
 * Validates and trims a display name.
 */
export const validateName = (
  name: string,
): Result<string, UserValidationError> => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { error: "NAME_EMPTY", success: false };
  if (trimmed.length > MAX_NAME_LENGTH)
    return { error: "NAME_TOO_LONG", success: false };
  return { data: trimmed, success: true };
};

/**
 * Maps user validation errors to i18n keys.
 */
const userValidationErrorI18nKeys = {
  EMAIL_EMPTY: "validation.emailRequired",
  EMAIL_INVALID: "validation.emailInvalid",
  NAME_EMPTY: "validation.nameRequired",
  NAME_TOO_LONG: "validation.nameTooLong",
} as const;

export const userValidationErrorToI18nKey = (
  error: UserValidationError,
): (typeof userValidationErrorI18nKeys)[UserValidationError] =>
  userValidationErrorI18nKeys[error];

/**
 * Type guard for UserValidationError.
 */
export const isUserValidationError = (
  value: string,
): value is UserValidationError => value in userValidationErrorI18nKeys;
