import { consumeRateLimit } from "@/lib/security/rate-limit";

import { ProjectServiceError } from "./errors";

export const PROJECT_GENERATION_RATE_LIMIT = {
  limit: 5,
  windowMs: 60_000,
} as const;

export function enforceProjectGenerationRateLimit(userId: string): void {
  const result = consumeRateLimit(
    `projects:generate:${userId}`,
    PROJECT_GENERATION_RATE_LIMIT,
  );

  if (!result.allowed) {
    throw new ProjectServiceError({
      status: 429,
      apiCode: "RATE_LIMITED",
      message:
        "Слишком много попыток создания сайта. Попробуйте немного позже.",
      retryAfterSeconds: result.retryAfterSeconds,
    });
  }
}
