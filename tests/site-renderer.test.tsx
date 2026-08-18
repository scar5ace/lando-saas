import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteRenderer } from "@/components/public-site/site-renderer";
import { MockLLMProvider } from "@/features/ai";

async function demoPage() {
  return new MockLLMProvider().generatePage({
    prompt:
      "Лендинг для семейного фотографа в Казани с услугами, отзывами и записью",
  });
}

describe("SiteRenderer", () => {
  it("renders exactly one H1", async () => {
    const page = await demoPage();

    render(<SiteRenderer page={page} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("uses the first visible content block as H1 after reordering", async () => {
    const page = await demoPage();
    const heroIndex = page.blocks.findIndex((block) => block.type === "hero");
    const laterContentIndex = page.blocks.findIndex(
      (block, index) =>
        index > heroIndex && block.type !== "header" && block.type !== "footer",
    );
    expect(heroIndex).toBeGreaterThanOrEqual(0);
    expect(laterContentIndex).toBeGreaterThan(heroIndex);

    const hero = page.blocks[heroIndex];
    const earlierContent = page.blocks[laterContentIndex];
    expect(hero?.type).toBe("hero");
    expect(earlierContent).toBeDefined();
    if (
      !hero ||
      hero.type !== "hero" ||
      !earlierContent ||
      earlierContent.type === "header" ||
      earlierContent.type === "footer"
    ) {
      throw new Error("Demo page must contain hero and a later content block.");
    }

    page.blocks[heroIndex] = earlierContent;
    page.blocks[laterContentIndex] = hero;
    render(<SiteRenderer page={page} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: earlierContent.content.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: hero.content.title }),
    ).toBeInTheDocument();
  });

  it("prevents preview links from navigating in editor mode", async () => {
    const page = await demoPage();
    const onSelectBlock = vi.fn();
    const { container } = render(
      <SiteRenderer page={page} editorMode onSelectBlock={onSelectBlock} />,
    );
    const link = container.querySelector("a[href]");
    expect(link).not.toBeNull();

    const allowed = fireEvent.click(link!);

    expect(allowed).toBe(false);
    expect(onSelectBlock).toHaveBeenCalledOnce();
  });
});
