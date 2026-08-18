import type { LLMProvider } from "@/types/ai";

import { MockLLMProvider } from "./mock-llm-provider";
import { GigaChatProvider } from "./gigachat-provider";
import { LLMProviderError } from "./provider";

export type LLMProviderName = "mock" | "gigachat";

/**
 * Provider selection stays server-side. Missing configuration may use mock in
 * local/test mode, but production never silently falls back to it.
 */
export function createLLMProvider(
  configuredProvider: string | undefined = process.env.LLM_PROVIDER,
): LLMProvider {
  const provider = configuredProvider?.trim().toLowerCase();

  if (
    provider === "mock" ||
    (!provider && process.env.NODE_ENV !== "production")
  ) {
    return new MockLLMProvider();
  }

  if (provider === "gigachat") {
    return new GigaChatProvider();
  }

  if (!provider) {
    throw new LLMProviderError(
      "PROVIDER_NOT_CONFIGURED",
      "LLM_PROVIDER must be configured in production.",
    );
  }

  throw new LLMProviderError(
    "PROVIDER_NOT_CONFIGURED",
    `LLM provider «${provider}» is not available in this build.`,
  );
}
