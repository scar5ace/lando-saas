import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({
  AuthRequiredError: class AuthRequiredError extends Error {},
}));

import {
  PROJECT_JSON_BODY_LIMIT_BYTES,
  projectApiErrorResponse,
  readProjectJsonBody,
} from "@/server/projects/http";
import { LLMProviderError } from "@/features/ai/provider";

afterEach(() => {
  vi.unstubAllEnvs();
});

function jsonRequest(body: BodyInit, headers?: HeadersInit) {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("readProjectJsonBody", () => {
  it("parses a bounded JSON body", async () => {
    await expect(
      readProjectJsonBody(jsonRequest(JSON.stringify({ revision: 3 }))),
    ).resolves.toEqual({ revision: 3 });
  });

  it("rejects an oversized declared Content-Length before parsing", async () => {
    const request = jsonRequest("{}", {
      "Content-Length": String(PROJECT_JSON_BODY_LIMIT_BYTES + 1),
    });

    await expect(readProjectJsonBody(request)).rejects.toMatchObject({
      status: 413,
      apiCode: "BAD_REQUEST",
    });
  });

  it("rejects an oversized streamed body even without Content-Length", async () => {
    const request = jsonRequest(
      JSON.stringify({ value: "x".repeat(PROJECT_JSON_BODY_LIMIT_BYTES) }),
    );

    await expect(readProjectJsonBody(request)).rejects.toMatchObject({
      status: 413,
      apiCode: "BAD_REQUEST",
    });
  });

  it("maps malformed JSON to a safe 400 error", async () => {
    await expect(readProjectJsonBody(jsonRequest("{"))).rejects.toMatchObject({
      status: 400,
      apiCode: "BAD_REQUEST",
    });
  });
});

describe("projectApiErrorResponse", () => {
  it("shows a safe timeout diagnostic during local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const cause = new Error("Generation request timeout");
    const error = new LLMProviderError(
      "PROVIDER_RESPONSE_INVALID",
      "Не удалось получить ответ от сервиса генерации.",
      { cause },
    );

    const response = projectApiErrorResponse(error);

    await expect(response.json()).resolves.toMatchObject({
      error: {
        message:
          "Не удалось получить ответ от сервиса генерации. Превышено время ожидания ответа нейросети.",
      },
    });
  });

  it("does not expose provider diagnostics in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = new LLMProviderError(
      "PROVIDER_RESPONSE_INVALID",
      "Сервис генерации не смог создать страницу (HTTP 403).",
    );

    const response = projectApiErrorResponse(error);

    await expect(response.json()).resolves.toMatchObject({
      error: { message: "Не удалось создать страницу. Попробуйте ещё раз." },
    });
  });
});
