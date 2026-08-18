import type {
  LLMProvider as LLMProviderContract,
  LLMProviderErrorCode,
} from "@/types/ai";

export type {
  EditBlockInput,
  EditPageInput,
  GeneratePageInput,
  LLMProviderErrorCode,
  RegenerateTextInput,
  TextResult,
} from "@/types/ai";

export type LLMProvider = LLMProviderContract;

export class LLMProviderError extends Error {
  readonly code: LLMProviderErrorCode;

  constructor(
    code: LLMProviderErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "LLMProviderError";
    this.code = code;
  }
}
