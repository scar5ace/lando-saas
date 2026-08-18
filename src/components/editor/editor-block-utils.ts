import type { BlockSchema, PageSchema } from "@/types";

export const blockTypeLabels: Record<BlockSchema["type"], string> = {
  header: "Шапка",
  hero: "Первый экран",
  features: "Преимущества",
  services: "Услуги",
  about: "О компании",
  steps: "Этапы работы",
  gallery: "Галерея",
  testimonials: "Отзывы",
  pricing: "Цены",
  team: "Команда",
  faq: "FAQ",
  cta: "Призыв к действию",
  contacts: "Контакты",
  leadForm: "Форма заявки",
  footer: "Подвал",
};

export function getBlockPrimaryText(block: BlockSchema): string {
  switch (block.type) {
    case "header":
      return block.content.logoText;
    case "footer":
      return block.content.brand;
    default:
      return block.content.title;
  }
}

export function getBlockPrimaryTextLimit(block: BlockSchema): number {
  if (block.type === "header") return 80;
  if (block.type === "footer") return 100;
  return 180;
}

export function updateBlockPrimaryText(
  block: BlockSchema,
  value: string,
): BlockSchema {
  switch (block.type) {
    case "header":
      return { ...block, content: { ...block.content, logoText: value } };
    case "hero":
      return { ...block, content: { ...block.content, title: value } };
    case "features":
      return { ...block, content: { ...block.content, title: value } };
    case "services":
      return { ...block, content: { ...block.content, title: value } };
    case "about":
      return { ...block, content: { ...block.content, title: value } };
    case "steps":
      return { ...block, content: { ...block.content, title: value } };
    case "gallery":
      return { ...block, content: { ...block.content, title: value } };
    case "testimonials":
      return { ...block, content: { ...block.content, title: value } };
    case "pricing":
      return { ...block, content: { ...block.content, title: value } };
    case "team":
      return { ...block, content: { ...block.content, title: value } };
    case "faq":
      return { ...block, content: { ...block.content, title: value } };
    case "cta":
      return { ...block, content: { ...block.content, title: value } };
    case "contacts":
      return { ...block, content: { ...block.content, title: value } };
    case "leadForm":
      return { ...block, content: { ...block.content, title: value } };
    case "footer":
      return { ...block, content: { ...block.content, brand: value } };
  }
}

export function replaceBlock(
  page: PageSchema,
  blockId: string,
  replacement: BlockSchema,
): PageSchema {
  return {
    ...page,
    blocks: page.blocks.map((block) =>
      block.id === blockId ? replacement : block,
    ),
  };
}

export function moveBlock(
  page: PageSchema,
  blockId: string,
  direction: -1 | 1,
): PageSchema {
  const from = page.blocks.findIndex((block) => block.id === blockId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= page.blocks.length) return page;
  const blocks = [...page.blocks];
  const [block] = blocks.splice(from, 1);
  if (!block) return page;
  blocks.splice(to, 0, block);
  return { ...page, blocks };
}

export function duplicateBlock(
  page: PageSchema,
  blockId: string,
): { page: PageSchema; newBlockId: string } {
  const index = page.blocks.findIndex((block) => block.id === blockId);
  const original = page.blocks[index];
  if (!original) return { page, newBlockId: blockId };

  const copy = structuredClone(original);
  const suffix = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 4)}`;
  const idPrefix = original.type === "leadForm" ? "lead-form" : original.type;
  copy.id = `${idPrefix}-copy-${suffix}`;
  if (copy.type === "leadForm") {
    const formSuffix = `_copy_${suffix}`;
    copy.content.formKey = `${copy.content.formKey.slice(
      0,
      64 - formSuffix.length,
    )}${formSuffix}`;
  }
  if (copy.type === "header" || copy.type === "footer") copy.hidden = true;

  const blocks = [...page.blocks];
  blocks.splice(index + 1, 0, copy);
  return { page: { ...page, blocks }, newBlockId: copy.id };
}
