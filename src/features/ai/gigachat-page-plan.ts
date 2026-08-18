import { z } from "zod";

import { pageSchema } from "@/lib/validation/page-schema";
import type { PageSchema } from "@/types/page-schema";

const text = (max: number) => z.string().trim().min(1).max(max);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const font = z.enum([
  "Inter",
  "Manrope",
  "Arial",
  "Helvetica",
  "Roboto",
  "Montserrat",
  "PT Sans",
  "Georgia",
]);

const featureBlockPlanSchema = z.strictObject({
  type: z.literal("features"),
  variant: z.enum(["cards", "icons-grid", "numbered-list"]),
  title: text(180),
  items: z
    .array(
      z.strictObject({
        title: text(120),
        description: text(500),
        icon: z.enum([
          "check",
          "star",
          "shield",
          "clock",
          "sparkles",
          "heart",
          "tools",
          "phone",
        ]),
      }),
    )
    .min(3)
    .max(6),
});

const servicesBlockPlanSchema = z.strictObject({
  type: z.literal("services"),
  variant: z.enum(["cards", "compact-list", "image-grid"]),
  title: text(180),
  items: z
    .array(
      z.strictObject({
        title: text(120),
        description: text(500),
        price: text(80),
      }),
    )
    .min(2)
    .max(6),
});

const aboutBlockPlanSchema = z.strictObject({
  type: z.literal("about"),
  variant: z.enum(["text", "image-right", "stats"]),
  title: text(180),
  body: text(1_500),
  stats: z
    .array(z.strictObject({ value: text(40), label: text(120) }))
    .min(2)
    .max(4),
});

const stepsBlockPlanSchema = z.strictObject({
  type: z.literal("steps"),
  variant: z.enum(["numbered", "timeline", "cards"]),
  title: text(180),
  items: z
    .array(z.strictObject({ title: text(120), description: text(500) }))
    .min(3)
    .max(6),
});

const faqBlockPlanSchema = z.strictObject({
  type: z.literal("faq"),
  variant: z.enum(["accordion", "two-columns", "simple"]),
  title: text(180),
  items: z
    .array(z.strictObject({ question: text(240), answer: text(1_000) }))
    .min(3)
    .max(6),
});

const pricingBlockPlanSchema = z.strictObject({
  type: z.literal("pricing"),
  variant: z.enum(["single-offer", "cards", "simple-list"]),
  title: text(180),
  plans: z
    .array(
      z.strictObject({
        name: text(100),
        priceText: text(80),
        description: text(500),
        features: z.array(text(160)).min(2).max(6),
        featured: z.boolean(),
      }),
    )
    .min(1)
    .max(4),
});

const ctaBlockPlanSchema = z.strictObject({
  type: z.literal("cta"),
  variant: z.enum(["centered", "split", "banner"]),
  title: text(180),
  description: text(500),
  buttonLabel: text(80),
});

const middleBlockPlanSchema = z.discriminatedUnion("type", [
  featureBlockPlanSchema,
  servicesBlockPlanSchema,
  aboutBlockPlanSchema,
  stepsBlockPlanSchema,
  faqBlockPlanSchema,
  pricingBlockPlanSchema,
  ctaBlockPlanSchema,
]);

export const gigaChatPagePlanSchema = z.strictObject({
  site: z.strictObject({
    title: text(120),
    description: text(300),
    brand: text(80),
    theme: z.strictObject({
      colorMode: z.enum(["light", "dark", "custom"]),
      primaryColor: color,
      backgroundColor: color,
      surfaceColor: color,
      textColor: color,
      mutedTextColor: color,
      headingFont: font,
      bodyFont: font,
      borderRadius: z.enum(["small", "medium", "large"]),
    }),
  }),
  hero: z.strictObject({
    variant: z.enum([
      "centered",
      "image-right",
      "image-left",
      "full-background",
    ]),
    eyebrow: text(100),
    title: text(180),
    description: text(800),
    primaryButtonLabel: text(80),
    imageKey: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    imageAlt: text(240),
  }),
  blocks: z.array(middleBlockPlanSchema).min(4).max(7),
  form: z.strictObject({
    variant: z.enum(["card", "split", "minimal"]),
    title: text(180),
    description: text(500),
    submitLabel: text(80),
    successMessage: text(500),
  }),
  contacts: z.strictObject({
    variant: z.enum(["details", "split", "mapless"]),
    title: text(180),
    items: z
      .array(z.strictObject({ label: text(100), value: text(240) }))
      .min(1)
      .max(6),
  }),
  footerLegalText: text(500),
});

export type GigaChatPagePlan = z.infer<typeof gigaChatPagePlanSchema>;

export const gigaChatContentBriefSchema = z.strictObject({
  style: z.enum([
    "warm",
    "natural",
    "modern",
    "elegant",
    "energetic",
    "corporate",
    "dark",
  ]),
  site: z.strictObject({
    title: text(120),
    description: text(300),
    brand: text(80),
  }),
  hero: z.strictObject({
    eyebrow: text(100),
    title: text(180),
    description: text(800),
    buttonLabel: text(80),
  }),
  features: z
    .array(z.strictObject({ title: text(120), description: text(500) }))
    .length(3),
  services: z
    .array(
      z.strictObject({
        title: text(120),
        description: text(500),
        price: text(80),
      }),
    )
    .min(2)
    .max(4),
  steps: z
    .array(z.strictObject({ title: text(120), description: text(500) }))
    .length(3),
  faq: z
    .array(z.strictObject({ question: text(240), answer: text(1_000) }))
    .length(3),
  form: z.strictObject({
    title: text(180),
    description: text(500),
    submitLabel: text(80),
    successMessage: text(500),
  }),
  contactsTitle: text(180),
  footerLegalText: text(500),
});

export type GigaChatContentBrief = z.infer<typeof gigaChatContentBriefSchema>;

const themes: Record<
  GigaChatContentBrief["style"],
  GigaChatPagePlan["site"]["theme"]
> = {
  warm: {
    colorMode: "light",
    primaryColor: "#B45309",
    backgroundColor: "#FFFBEB",
    surfaceColor: "#FFFFFF",
    textColor: "#292524",
    mutedTextColor: "#78716C",
    headingFont: "Georgia",
    bodyFont: "Inter",
    borderRadius: "large",
  },
  natural: {
    colorMode: "light",
    primaryColor: "#15803D",
    backgroundColor: "#F0FDF4",
    surfaceColor: "#FFFFFF",
    textColor: "#14532D",
    mutedTextColor: "#4B5563",
    headingFont: "Manrope",
    bodyFont: "Inter",
    borderRadius: "large",
  },
  modern: {
    colorMode: "light",
    primaryColor: "#2563EB",
    backgroundColor: "#F8FAFC",
    surfaceColor: "#FFFFFF",
    textColor: "#0F172A",
    mutedTextColor: "#64748B",
    headingFont: "Manrope",
    bodyFont: "Inter",
    borderRadius: "medium",
  },
  elegant: {
    colorMode: "light",
    primaryColor: "#7C3AED",
    backgroundColor: "#FAF5FF",
    surfaceColor: "#FFFFFF",
    textColor: "#2E1065",
    mutedTextColor: "#6B7280",
    headingFont: "Georgia",
    bodyFont: "Inter",
    borderRadius: "medium",
  },
  energetic: {
    colorMode: "light",
    primaryColor: "#E11D48",
    backgroundColor: "#FFF1F2",
    surfaceColor: "#FFFFFF",
    textColor: "#4C0519",
    mutedTextColor: "#6B7280",
    headingFont: "Montserrat",
    bodyFont: "Inter",
    borderRadius: "large",
  },
  corporate: {
    colorMode: "light",
    primaryColor: "#1D4ED8",
    backgroundColor: "#F1F5F9",
    surfaceColor: "#FFFFFF",
    textColor: "#0F172A",
    mutedTextColor: "#475569",
    headingFont: "Arial",
    bodyFont: "Arial",
    borderRadius: "small",
  },
  dark: {
    colorMode: "dark",
    primaryColor: "#22C55E",
    backgroundColor: "#0F172A",
    surfaceColor: "#1E293B",
    textColor: "#F8FAFC",
    mutedTextColor: "#CBD5E1",
    headingFont: "Manrope",
    bodyFont: "Inter",
    borderRadius: "medium",
  },
};

const featureIcons = ["star", "check", "heart"] as const;

export function buildPageFromGigaChatBrief(
  brief: GigaChatContentBrief,
): PageSchema {
  const plan: GigaChatPagePlan = {
    site: { ...brief.site, theme: themes[brief.style] },
    hero: {
      variant: brief.style === "corporate" ? "centered" : "image-right",
      eyebrow: brief.hero.eyebrow,
      title: brief.hero.title,
      description: brief.hero.description,
      primaryButtonLabel: brief.hero.buttonLabel,
      imageKey: `${brief.style}-business-scene`,
      imageAlt: `Иллюстрация: ${brief.hero.title}`.slice(0, 240),
    },
    blocks: [
      {
        type: "features",
        variant: "cards",
        title: "Почему выбирают нас",
        items: brief.features.map((item, index) => ({
          ...item,
          icon: featureIcons[index],
        })),
      },
      {
        type: "services",
        variant: "cards",
        title: "Что мы предлагаем",
        items: brief.services,
      },
      {
        type: "steps",
        variant: "numbered",
        title: "Как начать",
        items: brief.steps,
      },
      {
        type: "faq",
        variant: "accordion",
        title: "Частые вопросы",
        items: brief.faq,
      },
    ],
    form: { variant: "card", ...brief.form },
    contacts: {
      variant: "details",
      title: brief.contactsTitle,
      items: [
        {
          label: "Контакты",
          value: "Добавьте телефон, почту или адрес в редакторе сайта",
        },
      ],
    },
    footerLegalText: brief.footerLegalText,
  };

  return buildPageFromGigaChatPlan(plan);
}

const sectionLabels: Record<
  z.infer<typeof middleBlockPlanSchema>["type"],
  string
> = {
  features: "Преимущества",
  services: "Услуги",
  about: "О нас",
  steps: "Как это работает",
  faq: "Вопросы",
  pricing: "Цены",
  cta: "Связаться",
};

export function buildPageFromGigaChatPlan(plan: GigaChatPagePlan): PageSchema {
  const typeCounts = new Map<string, number>();
  const plannedBlocks = plan.blocks.map((block) => {
    const count = (typeCounts.get(block.type) ?? 0) + 1;
    typeCounts.set(block.type, count);
    const id = count === 1 ? block.type : `${block.type}-${count}`;
    const common = {
      id,
      type: block.type,
      variant: block.variant,
      hidden: false,
      style: { padding: "large" as const },
    };

    switch (block.type) {
      case "features":
        return {
          ...common,
          content: { title: block.title, items: block.items },
        };
      case "services":
        return {
          ...common,
          content: {
            title: block.title,
            items: block.items.map((item) => ({
              ...item,
              button: {
                label: "Оставить заявку",
                action: { type: "scroll" as const, target: "lead-form" },
                style: "outline" as const,
              },
            })),
          },
        };
      case "about":
        return {
          ...common,
          content: { title: block.title, text: block.body, stats: block.stats },
        };
      case "steps":
        return {
          ...common,
          content: { title: block.title, items: block.items },
        };
      case "faq":
        return {
          ...common,
          content: { title: block.title, items: block.items },
        };
      case "pricing":
        return {
          ...common,
          content: {
            title: block.title,
            plans: block.plans.map((item) => ({
              ...item,
              button: {
                label: "Выбрать",
                action: { type: "scroll" as const, target: "lead-form" },
                style: "primary" as const,
              },
            })),
          },
        };
      case "cta":
        return {
          ...common,
          content: {
            title: block.title,
            description: block.description,
            button: {
              label: block.buttonLabel,
              action: { type: "scroll" as const, target: "lead-form" },
              style: "primary" as const,
            },
          },
        };
    }
  });

  const navigation = plannedBlocks.slice(0, 5).map((block) => ({
    label: sectionLabels[block.type],
    action: { type: "scroll" as const, target: block.id },
  }));

  return pageSchema.parse({
    schemaVersion: 1,
    site: {
      title: plan.site.title,
      description: plan.site.description,
      language: "ru",
      theme: plan.site.theme,
      seo: {
        title: plan.site.title.slice(0, 70),
        description: plan.site.description.slice(0, 180),
        indexing: true,
      },
    },
    blocks: [
      {
        id: "header",
        type: "header",
        variant: "with-cta",
        hidden: false,
        content: {
          logoText: plan.site.brand,
          navLinks: navigation,
          cta: {
            label: plan.hero.primaryButtonLabel,
            action: { type: "scroll", target: "lead-form" },
            style: "primary",
          },
        },
      },
      {
        id: "hero",
        type: "hero",
        variant: plan.hero.variant,
        hidden: false,
        style: { padding: "large" },
        content: {
          eyebrow: plan.hero.eyebrow,
          title: plan.hero.title,
          description: plan.hero.description,
          image: {
            demoAssetKey: plan.hero.imageKey,
            alt: plan.hero.imageAlt,
            crop: "cover",
          },
          primaryButton: {
            label: plan.hero.primaryButtonLabel,
            action: { type: "scroll", target: "lead-form" },
            style: "primary",
          },
        },
      },
      ...plannedBlocks,
      {
        id: "lead-form",
        type: "leadForm",
        variant: plan.form.variant,
        hidden: false,
        style: { padding: "large" },
        content: {
          title: plan.form.title,
          description: plan.form.description,
          formKey: "main-request",
          fields: [
            { type: "name", key: "name", label: "Имя", required: true },
            {
              type: "phone",
              key: "phone",
              label: "Телефон",
              required: true,
            },
            {
              type: "textarea",
              key: "comment",
              label: "Комментарий",
              required: false,
            },
          ],
          submitLabel: plan.form.submitLabel,
          successMessage: plan.form.successMessage,
          consent: {
            label: "Я согласен на обработку персональных данных",
            required: true,
          },
        },
      },
      {
        id: "contacts",
        type: "contacts",
        variant: plan.contacts.variant,
        hidden: false,
        style: { padding: "large" },
        content: {
          title: plan.contacts.title,
          contacts: plan.contacts.items,
        },
      },
      {
        id: "footer",
        type: "footer",
        variant: "with-brand",
        hidden: false,
        content: {
          brand: plan.site.brand,
          links: navigation,
          legalText: plan.footerLegalText,
        },
      },
    ],
  });
}
