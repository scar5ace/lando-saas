import { describe, expect, it } from "vitest";

import { MockLLMProvider } from "@/features/ai";
import {
  BLOCK_TYPES,
  imageRefSchema,
  pagePatchSchema,
  pageSchema,
  parsePageSchema,
  safeWebUrlSchema,
} from "@/lib/validation/page-schema";
import { sanitizePlainText } from "@/lib/security/sanitize";

const TEST_PROMPT =
  "Создай современный лендинг для мастера по установке кондиционеров в Саратове.";

async function validPage() {
  return new MockLLMProvider().generatePage({ prompt: TEST_PROMPT });
}

describe("PageSchema v1", () => {
  it("declares the closed catalog of all 15 block types", () => {
    expect(BLOCK_TYPES).toEqual([
      "header",
      "hero",
      "features",
      "services",
      "about",
      "steps",
      "gallery",
      "testimonials",
      "pricing",
      "team",
      "faq",
      "cta",
      "contacts",
      "leadForm",
      "footer",
    ]);
  });

  it("accepts a canonical mock page and enforces schemaVersion 1", async () => {
    const page = await validPage();
    expect(pageSchema.safeParse(page).success).toBe(true);
    expect(pageSchema.safeParse({ ...page, schemaVersion: 2 }).success).toBe(
      false,
    );
  });

  it("rejects unknown fields at every canonical boundary", async () => {
    const page = await validPage();

    expect(
      pageSchema.safeParse({ ...page, executable: "alert(1)" }).success,
    ).toBe(false);
    expect(
      pageSchema.safeParse({
        ...page,
        site: { ...page.site, rawHtml: "<b>brand</b>" },
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate block IDs", async () => {
    const page = await validPage();
    const duplicate = structuredClone(page);
    duplicate.blocks[duplicate.blocks.length - 1].id = duplicate.blocks[0].id;

    expect(pageSchema.safeParse(duplicate).success).toBe(false);
  });

  it("rejects scroll actions whose target does not exist", async () => {
    const page = await validPage();
    const broken = structuredClone(page);
    const hero = broken.blocks.find((block) => block.type === "hero");
    expect(hero).toBeDefined();
    if (!hero) {
      throw new Error("Fixture must contain a hero block.");
    }

    hero.content.primaryButton.action = {
      type: "scroll",
      target: "missing-block",
    };
    expect(pageSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects duplicate form field keys", async () => {
    const page = await validPage();
    const broken = structuredClone(page);
    const form = broken.blocks.find((block) => block.type === "leadForm");
    expect(form).toBeDefined();
    if (!form) {
      throw new Error("Fixture must contain a lead form block.");
    }

    form.content.fields[1].key = form.content.fields[0].key;
    expect(pageSchema.safeParse(broken).success).toBe(false);
  });

  it("allows only safe HTTP(S) URLs and project/demo image references", () => {
    expect(safeWebUrlSchema.safeParse("https://example.ru/path").success).toBe(
      true,
    );
    expect(safeWebUrlSchema.safeParse("javascript:alert(1)").success).toBe(
      false,
    );
    expect(safeWebUrlSchema.safeParse("data:text/html,test").success).toBe(
      false,
    );

    expect(
      imageRefSchema.safeParse({
        demoAssetKey: "service-cover",
        alt: "Пример выполненной работы",
      }).success,
    ).toBe(true);
    expect(
      imageRefSchema.safeParse({
        demoAssetKey: "service-cover",
        assetId: "0f78b423-8656-4c5e-8813-eb1e35619334",
        alt: "Недопустимая двойная ссылка",
      }).success,
    ).toBe(false);
    expect(
      imageRefSchema.safeParse({
        url: "https://untrusted.example/image.jpg",
        alt: "Удалённое изображение",
      }).success,
    ).toBe(false);
  });

  it("stores plain text, never HTML", async () => {
    const page = await validPage();
    const unsafe = structuredClone(page);
    unsafe.site.title = "<strong>Надёжный сервис</strong>";

    expect(pageSchema.safeParse(unsafe).success).toBe(false);
    expect(parsePageSchema(unsafe).site.title).toBe("Надёжный сервис");
    expect(sanitizePlainText("<script>alert(1)</script> Привет")).toBe(
      "Привет",
    );
  });
});

describe("PagePatch", () => {
  it("accepts only the six closed operation types", () => {
    expect(
      pagePatchSchema.safeParse([
        {
          type: "moveBlock",
          blockId: "hero-1",
          newIndex: 2,
        },
        {
          type: "updateSiteTheme",
          changes: { primaryColor: "#1D4ED8" },
        },
      ]).success,
    ).toBe(true);

    expect(
      pagePatchSchema.safeParse([{ type: "runCode", code: "alert(1)" }])
        .success,
    ).toBe(false);
  });

  it("does not let updateBlock mutate id or type", () => {
    expect(
      pagePatchSchema.safeParse([
        {
          type: "updateBlock",
          blockId: "hero-1",
          changes: { id: "hijacked" },
        },
      ]).success,
    ).toBe(false);
    expect(
      pagePatchSchema.safeParse([
        {
          type: "updateBlock",
          blockId: "hero-1",
          changes: { type: "footer" },
        },
      ]).success,
    ).toBe(false);
  });
});
