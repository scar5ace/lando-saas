import { z } from "zod";

import { productConfig } from "@/config/product";
import { stageOnePageSchema } from "@/lib/validation/page-schema";

const UNSAFE_PROMPT_CHARACTER_PATTERN =
  /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/;

export const projectPromptSchema = z
  .string()
  .trim()
  .min(20, "Опишите сайт подробнее — минимум 20 символов.")
  .max(
    productConfig.promptLimit,
    `Описание не должно превышать ${productConfig.promptLimit} символов.`,
  )
  .refine((value) => !UNSAFE_PROMPT_CHARACTER_PATTERN.test(value), {
    message: "Описание должно быть обычным текстом без HTML.",
  });

export const createProjectInputSchema = z.strictObject({
  prompt: projectPromptSchema,
});

const projectRevisionSchema = z
  .number()
  .int("Номер редакции должен быть целым числом.")
  .min(0, "Номер редакции не может быть отрицательным.");

export const updateProjectInputSchema = z.strictObject({
  schema: stageOnePageSchema,
  revision: projectRevisionSchema,
});

export const patchProjectInputSchema = updateProjectInputSchema;

export const publishProjectInputSchema = z.strictObject({
  revision: projectRevisionSchema,
});

export const projectIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Некорректный идентификатор проекта.");

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;
export type PublishProjectInput = z.infer<typeof publishProjectInputSchema>;
