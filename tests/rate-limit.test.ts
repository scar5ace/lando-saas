import { beforeEach, describe, expect, it } from "vitest";

import {
  consumeRateLimit,
  resetRateLimitsForTests,
} from "@/lib/security/rate-limit";

describe("consumeRateLimit", () => {
  beforeEach(resetRateLimitsForTests);

  it("закрывает запросы сверх лимита и открывает после окна", () => {
    expect(
      consumeRateLimit("user", { limit: 2, windowMs: 1_000 }, 0).allowed,
    ).toBe(true);
    expect(
      consumeRateLimit("user", { limit: 2, windowMs: 1_000 }, 10).allowed,
    ).toBe(true);
    expect(
      consumeRateLimit("user", { limit: 2, windowMs: 1_000 }, 20).allowed,
    ).toBe(false);
    expect(
      consumeRateLimit("user", { limit: 2, windowMs: 1_000 }, 1_001).allowed,
    ).toBe(true);
  });
});
