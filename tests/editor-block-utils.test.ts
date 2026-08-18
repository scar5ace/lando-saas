import { describe, expect, it } from "vitest";

import {
  duplicateBlock,
  moveBlock,
  updateBlockPrimaryText,
} from "@/components/editor/editor-block-utils";
import { MockLLMProvider } from "@/features/ai";
import { pageSchema } from "@/lib/validation/page-schema";

async function demoPage() {
  return new MockLLMProvider().generatePage({
    prompt:
      "Лендинг для семейного фотографа в Казани с услугами, отзывами и записью",
  });
}

describe("editor block commands", () => {
  it("moves a block without changing its identity", async () => {
    const page = await demoPage();
    const movedId = page.blocks[2]?.id;
    expect(movedId).toBeDefined();

    const result = moveBlock(page, movedId!, -1);

    expect(result.blocks[1]?.id).toBe(movedId);
    expect(pageSchema.safeParse(result).success).toBe(true);
  });

  it("duplicates a header as hidden with a fresh stable id", async () => {
    const page = await demoPage();
    const header = page.blocks.find((block) => block.type === "header");
    expect(header).toBeDefined();

    const result = duplicateBlock(page, header!.id);
    const copy = result.page.blocks.find(
      (block) => block.id === result.newBlockId,
    );

    expect(copy?.type).toBe("header");
    expect(copy?.hidden).toBe(true);
    expect(result.newBlockId).not.toBe(header!.id);
    expect(pageSchema.safeParse(result.page).success).toBe(true);
  });

  it("gives a duplicated form its own form key", async () => {
    const page = await demoPage();
    const form = page.blocks.find((block) => block.type === "leadForm");
    expect(form?.type).toBe("leadForm");
    if (!form || form.type !== "leadForm") return;

    const result = duplicateBlock(page, form.id);
    const copy = result.page.blocks.find(
      (block) => block.id === result.newBlockId,
    );

    expect(copy?.type).toBe("leadForm");
    if (!copy || copy.type !== "leadForm") return;
    expect(copy.content.formKey).not.toBe(form.content.formKey);
    const validation = pageSchema.safeParse(result.page);
    expect(
      validation.success,
      validation.success ? "" : JSON.stringify(validation.error.issues),
    ).toBe(true);
  });

  it("updates only the primary text of a block", async () => {
    const page = await demoPage();
    const hero = page.blocks.find((block) => block.type === "hero");
    expect(hero?.type).toBe("hero");
    if (!hero || hero.type !== "hero") return;

    const result = updateBlockPrimaryText(hero, "Новый заголовок");

    expect(result.type).toBe("hero");
    if (result.type !== "hero") {
      throw new Error("Команда изменила тип блока");
    }
    expect(result.content.title).toBe("Новый заголовок");
    expect(result.id).toBe(hero.id);
  });
});
