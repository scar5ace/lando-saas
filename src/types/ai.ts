import type {
  BlockPatch,
  BlockSchema,
  PagePatch,
  PageSchema,
} from "@/types/page-schema";

export type GeneratePageInput = {
  prompt: string;
  correlationId?: string;
};

export type EditPageInput = {
  prompt: string;
  page: PageSchema;
  correlationId?: string;
};

export type EditBlockInput = {
  prompt: string;
  block: BlockSchema;
  correlationId?: string;
};

export type RegenerateTextInput = {
  text: string;
  instruction: string;
  correlationId?: string;
};

export type TextResult = {
  text: string;
};

export interface LLMProvider {
  generatePage(input: GeneratePageInput): Promise<PageSchema>;
  editPage(input: EditPageInput): Promise<PagePatch>;
  editBlock(input: EditBlockInput): Promise<BlockPatch>;
  regenerateText(input: RegenerateTextInput): Promise<TextResult>;
}

export type LLMProviderErrorCode =
  | "INVALID_PROVIDER_INPUT"
  | "PROVIDER_CAPABILITY_UNAVAILABLE"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_RESPONSE_INVALID";
