import { z } from "zod";

import { LLMProviderError } from "@/features/ai/provider";
import { apiError } from "@/lib/http/responses";
import {
  parseUntrustedJson,
  UNTRUSTED_JSON_LIMITS,
  UnsafeInputError,
} from "@/lib/security/sanitize";
import { AuthRequiredError } from "@/server/auth";

import { ProjectServiceError } from "./errors";

// The envelope adds only `schema` and `revision` around a canonical page.
// A small allowance keeps the canonical 256 KiB boundary representable while
// still bounding whitespace and unknown request fields before JSON.parse.
export const PROJECT_JSON_BODY_LIMIT_BYTES =
  UNTRUSTED_JSON_LIMITS.maxBytes + 1_024;

function invalidJsonBodyError(cause?: unknown): ProjectServiceError {
  return new ProjectServiceError({
    status: 400,
    apiCode: "BAD_REQUEST",
    message: "Тело запроса должно быть корректным JSON.",
    cause,
  });
}

function oversizedJsonBodyError(cause?: unknown): ProjectServiceError {
  return new ProjectServiceError({
    status: 413,
    apiCode: "BAD_REQUEST",
    message: `Тело запроса превышает лимит ${PROJECT_JSON_BODY_LIMIT_BYTES} байт.`,
    cause,
  });
}

function declaredContentLength(request: Request): number | null {
  const rawLength = request.headers.get("content-length")?.trim();
  if (!rawLength || !/^\d+$/.test(rawLength)) return null;

  const length = Number(rawLength);
  return Number.isSafeInteger(length) ? length : Number.POSITIVE_INFINITY;
}

async function readBoundedRequestText(request: Request): Promise<string> {
  const declaredLength = declaredContentLength(request);
  if (
    declaredLength !== null &&
    declaredLength > PROJECT_JSON_BODY_LIMIT_BYTES
  ) {
    throw oversizedJsonBodyError();
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > PROJECT_JSON_BODY_LIMIT_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw oversizedJsonBodyError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch (error) {
    throw invalidJsonBodyError(error);
  }
}

export async function readProjectJsonBody(request: Request): Promise<unknown> {
  try {
    const serialized = await readBoundedRequestText(request);
    return parseUntrustedJson(serialized, PROJECT_JSON_BODY_LIMIT_BYTES);
  } catch (error) {
    if (error instanceof ProjectServiceError) throw error;
    if (
      error instanceof UnsafeInputError &&
      error.code === "PAYLOAD_TOO_LARGE"
    ) {
      throw oversizedJsonBodyError(error);
    }
    throw invalidJsonBodyError(error);
  }
}

function errorCauses(error: unknown): unknown[] {
  const causes: unknown[] = [];
  let current = error;

  for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
    causes.push(current);
    current = current.cause;
  }

  return causes;
}

function localProviderErrorMessage(error: LLMProviderError): string {
  if (process.env.NODE_ENV === "production") {
    return "Не удалось создать страницу. Попробуйте ещё раз.";
  }

  const causes = errorCauses(error);
  const causeNames = causes.map((cause) =>
    cause instanceof Error ? cause.name : "",
  );
  const causeCodes = causes.map((cause) => {
    if (!(cause instanceof Error) || !("code" in cause)) return "";
    return String(cause.code);
  });
  const causeMessages = causes.map((cause) =>
    cause instanceof Error ? cause.message.toLowerCase() : "",
  );

  if (
    causeNames.some(
      (name) => name === "AbortError" || name === "TimeoutError",
    ) ||
    causeCodes.includes("ABORT_ERR") ||
    causeMessages.some((message) => message.includes("timeout"))
  ) {
    return `${error.message} Превышено время ожидания ответа нейросети.`;
  }

  if (causeCodes.some((code) => code === "ENOTFOUND" || code === "EAI_AGAIN")) {
    return `${error.message} Не удалось определить сетевой адрес сервиса генерации (ошибка DNS).`;
  }

  if (
    causeCodes.some((code) =>
      [
        "CERT_HAS_EXPIRED",
        "DEPTH_ZERO_SELF_SIGNED_CERT",
        "SELF_SIGNED_CERT_IN_CHAIN",
        "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
      ].includes(code),
    )
  ) {
    return `${error.message} Не удалось проверить сертификат сервиса генерации.`;
  }

  const validationError = causes.find(
    (cause): cause is z.ZodError => cause instanceof z.ZodError,
  );
  if (validationError) {
    const issue = validationError.issues[0];
    const path = issue?.path.length ? ` Поле: ${issue.path.join(".")}.` : "";
    return `${error.message}${path}`;
  }

  return error.message;
}

export function projectApiErrorResponse(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return apiError(
      401,
      "UNAUTHORIZED",
      "Войдите в аккаунт, чтобы продолжить.",
    );
  }

  if (error instanceof ProjectServiceError) {
    const response = apiError(error.status, error.apiCode, error.message);
    if (error.retryAfterSeconds !== undefined) {
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
    }
    return response;
  }

  if (error instanceof z.ZodError) {
    const firstIssue = error.issues[0];
    return apiError(
      422,
      "VALIDATION_ERROR",
      firstIssue?.message ?? "Проверьте введённые данные.",
    );
  }

  if (error instanceof LLMProviderError) {
    if (error.code === "INVALID_PROVIDER_INPUT") {
      return apiError(422, "VALIDATION_ERROR", error.message);
    }
    return apiError(500, "INTERNAL_ERROR", localProviderErrorMessage(error));
  }

  return apiError(
    500,
    "INTERNAL_ERROR",
    "Не удалось выполнить запрос. Попробуйте ещё раз.",
  );
}
