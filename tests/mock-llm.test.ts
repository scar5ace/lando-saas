import { describe, expect, it } from "vitest";

import {
  createLLMProvider,
  LLMProviderError,
  MockLLMProvider,
} from "@/features/ai";
import { pageSchema } from "@/lib/validation/page-schema";

const CLIMATE_PROMPT =
  "Создай современный лендинг для мастера по установке кондиционеров в Саратове. Нужны первый экран, преимущества, услуги с ценами, этапы работы, отзывы, FAQ, форма заявки и контакты. Стиль светлый, надёжный и современный, основной цвет синий";

describe("MockLLMProvider", () => {
  it("deterministically creates a valid Russian 7–10 block climate landing", async () => {
    const provider = new MockLLMProvider();
    const first = await provider.generatePage({ prompt: CLIMATE_PROMPT });
    const second = await provider.generatePage({ prompt: CLIMATE_PROMPT });

    expect(first).toEqual(second);
    expect(pageSchema.safeParse(first).success).toBe(true);
    expect(first.schemaVersion).toBe(1);
    expect(first.site.language).toBe("ru");
    expect(first.blocks.length).toBeGreaterThanOrEqual(7);
    expect(first.blocks.length).toBeLessThanOrEqual(10);
    expect(first.site.title).toContain("кондиционеров");
    expect(first.site.title).toContain("Саратове");
    expect(first.blocks.some((block) => block.type === "leadForm")).toBe(true);
    expect(first.blocks.some((block) => block.type === "contacts")).toBe(true);
  });

  it("returns a safe generic landing for an unrelated or hostile prompt", async () => {
    const page = await new MockLLMProvider().generatePage({
      prompt: "Лендинг пекарни <script>alert(1)</script>",
    });
    const serialized = JSON.stringify(page).toLowerCase();

    expect(pageSchema.safeParse(page).success).toBe(true);
    expect(page.site.title).toBe("Надёжные услуги для дома и бизнеса");
    expect(serialized).not.toContain("<script");
    expect(serialized).not.toContain("javascript:");
  });

  it("rejects an empty prompt", async () => {
    await expect(
      new MockLLMProvider().generatePage({ prompt: "  <b></b>  " }),
    ).rejects.toMatchObject({ code: "INVALID_PROVIDER_INPUT" });
  });

  it("honestly reports unsupported edit capabilities", async () => {
    const provider = new MockLLMProvider();
    const page = await provider.generatePage({ prompt: CLIMATE_PROMPT });

    await expect(
      provider.editPage({ prompt: "Сделай ярче", page }),
    ).rejects.toMatchObject({ code: "PROVIDER_CAPABILITY_UNAVAILABLE" });
  });

  it("is selected explicitly by the provider factory", () => {
    expect(createLLMProvider("mock")).toBeInstanceOf(MockLLMProvider);
    expect(() => createLLMProvider("unknown-provider")).toThrow(
      LLMProviderError,
    );
  });
});
