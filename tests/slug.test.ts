import { describe, expect, it } from "vitest";

import { slugify } from "@/features/projects/slug";

describe("slugify", () => {
  it("транслитерирует русский текст", () => {
    expect(slugify("Ремонт кондиционеров в Саратове")).toBe(
      "remont-kondicionerov-v-saratove",
    );
  });

  it("не оставляет небезопасные символы", () => {
    expect(slugify("  <script>Привет!</script>  ")).toBe(
      "script-privet-script",
    );
  });
});
