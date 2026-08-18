export const productConfig = {
  name: process.env.APP_NAME?.trim() || "Lando",
  slogan: "Создайте сайт одной фразой",
  description:
    "Опишите свой бизнес — Lando подготовит структуру, тексты и дизайн готового лендинга.",
  proPriceRub: 690,
  promptLimit: 2_000,
  freeProjectLimit: 1,
  historyLimit: 20,
} as const;

export type ProductConfig = typeof productConfig;
