import { beforeAll, describe, expect, it } from "vitest";

import { MockLLMProvider } from "@/features/ai";
import {
  createProjectInputSchema,
  projectIdSchema,
  publishProjectInputSchema,
  updateProjectInputSchema,
} from "@/features/projects/schemas";
import type { PageSchema } from "@/types/page-schema";

let validPage: PageSchema;

beforeAll(async () => {
  validPage = await new MockLLMProvider().generatePage({
    prompt:
      "Создай современный лендинг для мастера по установке кондиционеров в Саратове.",
  });
});

describe("createProjectInputSchema", () => {
  it("принимает и обрезает пробелы в описании от 20 до 2000 символов", () => {
    expect(
      createProjectInputSchema.parse({ prompt: `  ${"а".repeat(20)}  ` }),
    ).toEqual({ prompt: "а".repeat(20) });
    expect(
      createProjectInputSchema.safeParse({ prompt: "а".repeat(2_000) }).success,
    ).toBe(true);
  });

  it("отклоняет слишком короткое, слишком длинное и HTML-описание", () => {
    expect(
      createProjectInputSchema.safeParse({ prompt: "слишком коротко" }).success,
    ).toBe(false);
    expect(
      createProjectInputSchema.safeParse({ prompt: "а".repeat(2_001) }).success,
    ).toBe(false);
    expect(
      createProjectInputSchema.safeParse({
        prompt: "Создай страницу <script>alert(1)</script>",
      }).success,
    ).toBe(false);
  });

  it("отклоняет неизвестные поля", () => {
    expect(
      createProjectInputSchema.safeParse({
        prompt: "Создай понятный сайт для локальной мастерской",
        userId: "foreign-user",
      }).success,
    ).toBe(false);
  });
});

describe("updateProjectInputSchema", () => {
  it("принимает только полную PageSchema и неотрицательную revision", () => {
    expect(
      updateProjectInputSchema.safeParse({ schema: validPage, revision: 0 })
        .success,
    ).toBe(true);
    expect(
      updateProjectInputSchema.safeParse({ schema: validPage, revision: -1 })
        .success,
    ).toBe(false);
    expect(
      updateProjectInputSchema.safeParse({ schema: validPage, revision: 1.5 })
        .success,
    ).toBe(false);
  });

  it("не разрешает менять служебные поля через PATCH", () => {
    expect(
      updateProjectInputSchema.safeParse({
        schema: validPage,
        revision: 0,
        projectId: "another-project",
      }).success,
    ).toBe(false);
  });

  it("на этапе 1 отклоняет assetId, но принимает встроенные demoAssetKey", () => {
    expect(
      updateProjectInputSchema.safeParse({ schema: validPage, revision: 0 })
        .success,
    ).toBe(true);

    const pageWithAsset = structuredClone(validPage);
    pageWithAsset.site.seo.favicon = {
      assetId: "0f78b423-8656-4c5e-8813-eb1e35619334",
      alt: "Иконка проекта",
    };
    const result = updateProjectInputSchema.safeParse({
      schema: pageWithAsset,
      revision: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("demoAssetKey");
    }
  });
});

describe("publishProjectInputSchema", () => {
  it("принимает только ожидаемую целую revision", () => {
    expect(publishProjectInputSchema.safeParse({ revision: 0 }).success).toBe(
      true,
    );
    expect(publishProjectInputSchema.safeParse({}).success).toBe(false);
    expect(publishProjectInputSchema.safeParse({ revision: -1 }).success).toBe(
      false,
    );
    expect(publishProjectInputSchema.safeParse({ revision: 1.5 }).success).toBe(
      false,
    );
    expect(
      publishProjectInputSchema.safeParse({ revision: 1, projectId: "foreign" })
        .success,
    ).toBe(false);
  });
});

describe("projectIdSchema", () => {
  it("принимает безопасный ID и отклоняет сегменты пути", () => {
    expect(projectIdSchema.safeParse("cm123_project-id").success).toBe(true);
    expect(projectIdSchema.safeParse("../foreign-project").success).toBe(false);
  });
});
