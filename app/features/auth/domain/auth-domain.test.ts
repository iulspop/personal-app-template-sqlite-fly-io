import { describe, expect, test } from "vitest";

import {
  buildMagicLinkUrl,
  computeSessionExpiry,
  computeVerificationExpiry,
  isSessionExpired,
} from "./auth-domain";

describe("isSessionExpired()", () => {
  test("given: an expiration in the past, should: return true", () => {
    const past = new Date("2024-01-01");
    const now = new Date("2024-06-01");

    expect(isSessionExpired(past, now)).toBe(true);
  });

  test("given: an expiration in the future, should: return false", () => {
    const future = new Date("2025-01-01");
    const now = new Date("2024-06-01");

    expect(isSessionExpired(future, now)).toBe(false);
  });

  test("given: an expiration equal to now, should: return true (boundary)", () => {
    const now = new Date("2024-06-01");

    expect(isSessionExpired(now, now)).toBe(true);
  });
});

describe("computeSessionExpiry()", () => {
  test("given: 30 days from now, should: return date 30 days ahead", () => {
    const now = new Date("2024-01-01T00:00:00Z");
    const result = computeSessionExpiry(30, now);

    expect(result).toEqual(new Date("2024-01-31T00:00:00Z"));
  });
});

describe("computeVerificationExpiry()", () => {
  test("given: 10 minutes from now, should: return date 10 minutes ahead", () => {
    const now = new Date("2024-01-01T00:00:00Z");
    const result = computeVerificationExpiry(10, now);

    expect(result).toEqual(new Date("2024-01-01T00:10:00Z"));
  });
});

describe("buildMagicLinkUrl()", () => {
  test("given: valid params, should: build a complete callback URL", () => {
    const result = buildMagicLinkUrl({
      baseUrl: "https://example.com",
      code: "ABC123",
      target: "alice@example.com",
      type: "login",
    });

    expect(result).toBe(
      "https://example.com/auth/callback?type=login&target=alice%40example.com&code=ABC123",
    );
  });
});
