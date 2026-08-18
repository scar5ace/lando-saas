import { z } from "zod";

import {
  prepareUntrustedJson,
  UNTRUSTED_JSON_LIMITS,
} from "@/lib/security/sanitize";

export const PAGE_SCHEMA_VERSION = 1 as const;

export const PAGE_SCHEMA_LIMITS = {
  maxBlocks: 40,
  maxArrayItems: 24,
  maxShortText: 160,
  maxText: 1_200,
  maxLongText: 4_000,
  maxCanonicalBytes: UNTRUSTED_JSON_LIMITS.maxBytes,
  maxPatchOperations: 20,
} as const;

const HTML_OR_CONTROL_PATTERN =
  /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/;

function plainText(maxLength: number, fieldName = "Текст") {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} не может быть пустым.`)
    .max(maxLength, `${fieldName} слишком длинный.`)
    .refine((value) => !HTML_OR_CONTROL_PATTERN.test(value), {
      message: `${fieldName} должен быть обычным текстом без HTML и управляющих символов.`,
    });
}

export const shortTextSchema = plainText(PAGE_SCHEMA_LIMITS.maxShortText);
export const textSchema = plainText(PAGE_SCHEMA_LIMITS.maxText);
export const longTextSchema = plainText(PAGE_SCHEMA_LIMITS.maxLongText);

export const blockIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "ID должен быть стабильным kebab-case идентификатором.",
  );

export const fieldKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_-]*$/, "Ключ поля имеет недопустимый формат.");

export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Цвет должен быть шестизначным HEX-значением.");

export const fontFamilySchema = z.enum([
  "Inter",
  "Manrope",
  "Arial",
  "Helvetica",
  "Roboto",
  "Montserrat",
  "PT Sans",
  "Georgia",
]);

export const publishedSiteThemeSchema = z.strictObject({
  colorMode: z.enum(["light", "dark", "custom"]),
  primaryColor: colorSchema,
  backgroundColor: colorSchema,
  surfaceColor: colorSchema,
  textColor: colorSchema,
  mutedTextColor: colorSchema,
  headingFont: fontFamilySchema,
  bodyFont: fontFamilySchema,
  borderRadius: z.enum(["small", "medium", "large"]),
});

export const themeSchema = publishedSiteThemeSchema;

function isSafeWebUrl(value: string): boolean {
  if (value !== value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.username === "" &&
      url.password === "" &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

export const safeWebUrlSchema = z
  .string()
  .max(2_048)
  .refine(
    isSafeWebUrl,
    "Разрешены только безопасные абсолютные HTTP(S)-ссылки.",
  );

export const emailAddressSchema = z.string().trim().max(254).email();
export const phoneNumberSchema = z
  .string()
  .trim()
  .min(5)
  .max(24)
  .regex(/^\+?[0-9 ()-]+$/, "Телефон содержит недопустимые символы.");

export const scrollActionSchema = z.strictObject({
  type: z.literal("scroll"),
  target: blockIdSchema,
});

export const urlActionSchema = z.strictObject({
  type: z.literal("url"),
  url: safeWebUrlSchema,
  newTab: z.boolean().optional(),
});

export const emailActionSchema = z.strictObject({
  type: z.literal("email"),
  email: emailAddressSchema,
});

export const phoneActionSchema = z.strictObject({
  type: z.literal("phone"),
  phone: phoneNumberSchema,
});

export const linkActionSchema = z.discriminatedUnion("type", [
  scrollActionSchema,
  urlActionSchema,
  emailActionSchema,
  phoneActionSchema,
]);

export const buttonSchema = z.strictObject({
  label: plainText(80, "Текст кнопки"),
  action: linkActionSchema,
  style: z.enum(["primary", "secondary", "outline", "ghost"]),
});

export const linkSchema = z.strictObject({
  label: plainText(80, "Текст ссылки"),
  action: linkActionSchema,
});

const focalPointSchema = z.strictObject({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

const imageDetailsShape = {
  alt: plainText(240, "Описание изображения"),
  crop: z.enum(["cover", "contain"]).optional(),
  focalPoint: focalPointSchema.optional(),
};

export const assetImageRefSchema = z.strictObject({
  assetId: z.string().uuid(),
  ...imageDetailsShape,
});

export const demoImageRefSchema = z.strictObject({
  demoAssetKey: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  ...imageDetailsShape,
});

export const imageRefSchema = z.union([
  assetImageRefSchema,
  demoImageRefSchema,
]);

export const seoSchema = z.strictObject({
  title: plainText(70, "SEO-заголовок"),
  description: plainText(180, "SEO-описание"),
  canonicalUrl: safeWebUrlSchema.optional(),
  favicon: imageRefSchema.optional(),
  ogImage: imageRefSchema.optional(),
  indexing: z.boolean(),
});

const baseFormFieldShape = {
  key: fieldKeySchema,
  label: plainText(100, "Название поля"),
  required: z.boolean(),
};

function textInputFieldSchema(
  type: "name" | "phone" | "email" | "shortText" | "textarea",
) {
  return z.strictObject({
    type: z.literal(type),
    ...baseFormFieldShape,
    placeholder: plainText(160, "Подсказка поля").optional(),
  });
}

export const nameFormFieldSchema = textInputFieldSchema("name");
export const phoneFormFieldSchema = textInputFieldSchema("phone");
export const emailFormFieldSchema = textInputFieldSchema("email");
export const shortTextFormFieldSchema = textInputFieldSchema("shortText");
export const textareaFormFieldSchema = textInputFieldSchema("textarea");

export const selectFormFieldSchema = z.strictObject({
  type: z.literal("select"),
  ...baseFormFieldShape,
  placeholder: plainText(160, "Подсказка поля").optional(),
  options: z
    .array(plainText(100, "Вариант ответа"))
    .min(1)
    .max(PAGE_SCHEMA_LIMITS.maxArrayItems),
});

export const checkboxFormFieldSchema = z.strictObject({
  type: z.literal("checkbox"),
  ...baseFormFieldShape,
});

export const consentFormFieldSchema = z.strictObject({
  type: z.literal("consent"),
  key: fieldKeySchema,
  label: plainText(300, "Текст согласия"),
  required: z.literal(true),
});

export const formFieldSchema = z.discriminatedUnion("type", [
  nameFormFieldSchema,
  phoneFormFieldSchema,
  emailFormFieldSchema,
  shortTextFormFieldSchema,
  textareaFormFieldSchema,
  selectFormFieldSchema,
  checkboxFormFieldSchema,
  consentFormFieldSchema,
]);

export const blockStyleSchema = z.strictObject({
  background: colorSchema.optional(),
  textColor: colorSchema.optional(),
  padding: z.enum(["none", "small", "medium", "large"]).optional(),
  alignment: z.enum(["left", "center", "right"]).optional(),
});

const headerContentSchema = z.strictObject({
  logoText: plainText(80, "Название бренда"),
  navLinks: z.array(linkSchema).max(8),
  cta: buttonSchema.optional(),
});

const heroContentSchema = z.strictObject({
  eyebrow: plainText(100).optional(),
  title: plainText(180, "Заголовок"),
  description: textSchema,
  image: imageRefSchema.optional(),
  primaryButton: buttonSchema,
  secondaryButton: buttonSchema.optional(),
});

const featureItemSchema = z.strictObject({
  title: plainText(120),
  description: textSchema,
  icon: z
    .enum([
      "check",
      "star",
      "shield",
      "clock",
      "sparkles",
      "heart",
      "tools",
      "phone",
    ])
    .optional(),
});

const featuresContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  items: z.array(featureItemSchema).min(1).max(12),
});

const serviceItemSchema = z.strictObject({
  title: plainText(120),
  description: textSchema,
  price: plainText(80).optional(),
  image: imageRefSchema.optional(),
  button: buttonSchema.optional(),
});

const servicesContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  items: z.array(serviceItemSchema).min(1).max(12),
});

const statisticSchema = z.strictObject({
  value: plainText(40),
  label: plainText(120),
});

const aboutContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  text: longTextSchema,
  image: imageRefSchema.optional(),
  stats: z.array(statisticSchema).min(1).max(8).optional(),
});

const stepItemSchema = z.strictObject({
  title: plainText(120),
  description: textSchema,
});

const stepsContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  items: z.array(stepItemSchema).min(1).max(12),
});

const galleryContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  images: z.array(imageRefSchema).min(1).max(16),
});

const testimonialItemSchema = z.strictObject({
  quote: textSchema,
  author: plainText(100),
  role: plainText(120).optional(),
  avatar: imageRefSchema.optional(),
});

const testimonialsContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  items: z.array(testimonialItemSchema).min(1).max(12),
});

const pricingPlanSchema = z.strictObject({
  name: plainText(100),
  priceText: plainText(80),
  description: textSchema.optional(),
  features: z.array(plainText(160)).min(1).max(16),
  button: buttonSchema,
  featured: z.boolean().optional(),
});

const pricingContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  plans: z.array(pricingPlanSchema).min(1).max(6),
});

const teamMemberSchema = z.strictObject({
  name: plainText(100),
  role: plainText(120),
  bio: textSchema.optional(),
  image: imageRefSchema.optional(),
});

const teamContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  members: z.array(teamMemberSchema).min(1).max(16),
});

const faqItemSchema = z.strictObject({
  question: plainText(240),
  answer: longTextSchema,
});

const faqContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  items: z.array(faqItemSchema).min(1).max(16),
});

const ctaContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  description: textSchema,
  button: buttonSchema,
  image: imageRefSchema.optional(),
});

const contactItemSchema = z.strictObject({
  label: plainText(100),
  value: plainText(240),
  action: linkActionSchema.optional(),
});

const contactsContentSchema = z.strictObject({
  title: plainText(180, "Заголовок"),
  contacts: z.array(contactItemSchema).min(1).max(12),
  address: plainText(300).optional(),
  hours: plainText(240).optional(),
});

export const formConsentSchema = z.strictObject({
  label: plainText(500, "Текст согласия"),
  required: z.boolean(),
  privacyUrl: safeWebUrlSchema.optional(),
});

const leadFormContentSchema = z
  .strictObject({
    title: plainText(180, "Заголовок"),
    description: textSchema,
    formKey: fieldKeySchema,
    fields: z.array(formFieldSchema).min(1).max(12),
    submitLabel: plainText(80, "Текст кнопки"),
    successMessage: textSchema,
    consent: formConsentSchema,
  })
  .superRefine((content, context) => {
    const keys = new Set<string>();
    for (const [index, field] of content.fields.entries()) {
      if (keys.has(field.key)) {
        context.addIssue({
          code: "custom",
          path: ["fields", index, "key"],
          message: `Ключ поля «${field.key}» должен быть уникальным в форме.`,
        });
      }
      keys.add(field.key);
    }
  });

const footerContentSchema = z.strictObject({
  brand: plainText(100),
  links: z.array(linkSchema).max(12),
  legalText: plainText(500).optional(),
});

const commonBlockShape = {
  id: blockIdSchema,
  hidden: z.boolean(),
  style: blockStyleSchema.optional(),
};

export const headerBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("header"),
  variant: z.enum(["simple", "centered", "with-cta"]),
  content: headerContentSchema,
});

export const heroBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("hero"),
  variant: z.enum(["centered", "image-right", "image-left", "full-background"]),
  content: heroContentSchema,
});

export const featuresBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("features"),
  variant: z.enum(["cards", "icons-grid", "numbered-list"]),
  content: featuresContentSchema,
});

export const servicesBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("services"),
  variant: z.enum(["cards", "compact-list", "image-grid"]),
  content: servicesContentSchema,
});

export const aboutBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("about"),
  variant: z.enum(["text", "image-right", "stats"]),
  content: aboutContentSchema,
});

export const stepsBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("steps"),
  variant: z.enum(["numbered", "timeline", "cards"]),
  content: stepsContentSchema,
});

export const galleryBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("gallery"),
  variant: z.enum(["grid", "masonry", "carousel"]),
  content: galleryContentSchema,
});

export const testimonialsBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("testimonials"),
  variant: z.enum(["cards", "quotes", "featured"]),
  content: testimonialsContentSchema,
});

export const pricingBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("pricing"),
  variant: z.enum(["single-offer", "cards", "simple-list"]),
  content: pricingContentSchema,
});

export const teamBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("team"),
  variant: z.enum(["cards", "compact", "featured"]),
  content: teamContentSchema,
});

export const faqBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("faq"),
  variant: z.enum(["accordion", "two-columns", "simple"]),
  content: faqContentSchema,
});

export const ctaBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("cta"),
  variant: z.enum(["centered", "split", "banner"]),
  content: ctaContentSchema,
});

export const contactsBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("contacts"),
  variant: z.enum(["details", "split", "mapless"]),
  content: contactsContentSchema,
});

export const leadFormBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("leadForm"),
  variant: z.enum(["card", "split", "minimal"]),
  content: leadFormContentSchema,
});

export const footerBlockSchema = z.strictObject({
  ...commonBlockShape,
  type: z.literal("footer"),
  variant: z.enum(["simple", "columns", "with-brand"]),
  content: footerContentSchema,
});

export const BLOCK_TYPES = [
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
] as const;

export const blockSchema = z.discriminatedUnion("type", [
  headerBlockSchema,
  heroBlockSchema,
  featuresBlockSchema,
  servicesBlockSchema,
  aboutBlockSchema,
  stepsBlockSchema,
  galleryBlockSchema,
  testimonialsBlockSchema,
  pricingBlockSchema,
  teamBlockSchema,
  faqBlockSchema,
  ctaBlockSchema,
  contactsBlockSchema,
  leadFormBlockSchema,
  footerBlockSchema,
]);

export const siteSchema = z.strictObject({
  title: plainText(120, "Название сайта"),
  description: plainText(300, "Описание сайта"),
  language: z.literal("ru"),
  theme: publishedSiteThemeSchema,
  seo: seoSchema,
});

function collectScrollTargets(value: unknown, targets: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectScrollTargets(item, targets);
    }
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  if (record.type === "scroll" && typeof record.target === "string") {
    targets.push(record.target);
  }

  for (const nested of Object.values(record)) {
    collectScrollTargets(nested, targets);
  }
}

const canonicalPageSchema = z.strictObject({
  schemaVersion: z.literal(PAGE_SCHEMA_VERSION),
  site: siteSchema,
  blocks: z.array(blockSchema).min(1).max(PAGE_SCHEMA_LIMITS.maxBlocks),
});

export const pageSchema = canonicalPageSchema.superRefine((page, context) => {
  const ids = new Set<string>();
  const formKeys = new Set<string>();
  let visibleHeaders = 0;
  let visibleFooters = 0;
  let visibleContentBlocks = 0;

  for (const [index, block] of page.blocks.entries()) {
    if (ids.has(block.id)) {
      context.addIssue({
        code: "custom",
        path: ["blocks", index, "id"],
        message: `ID блока «${block.id}» должен быть уникальным.`,
      });
    }
    ids.add(block.id);

    if (!block.hidden && block.type === "header") {
      visibleHeaders += 1;
    } else if (!block.hidden && block.type === "footer") {
      visibleFooters += 1;
    } else if (!block.hidden) {
      visibleContentBlocks += 1;
    }

    if (block.type === "leadForm") {
      if (formKeys.has(block.content.formKey)) {
        context.addIssue({
          code: "custom",
          path: ["blocks", index, "content", "formKey"],
          message: `Ключ формы «${block.content.formKey}» должен быть уникальным.`,
        });
      }
      formKeys.add(block.content.formKey);
    }
  }

  if (visibleHeaders > 1) {
    context.addIssue({
      code: "custom",
      path: ["blocks"],
      message: "На странице может быть не более одного видимого header.",
    });
  }

  if (visibleFooters > 1) {
    context.addIssue({
      code: "custom",
      path: ["blocks"],
      message: "На странице может быть не более одного видимого footer.",
    });
  }

  if (visibleContentBlocks === 0) {
    context.addIssue({
      code: "custom",
      path: ["blocks"],
      message: "Страница должна содержать видимый содержательный блок.",
    });
  }

  const targets: string[] = [];
  collectScrollTargets(page.blocks, targets);
  for (const target of targets) {
    if (!ids.has(target)) {
      context.addIssue({
        code: "custom",
        path: ["blocks"],
        message: `Якорная ссылка ведёт на отсутствующий блок «${target}».`,
      });
    }
  }

  const bytes = new TextEncoder().encode(JSON.stringify(page)).byteLength;
  if (bytes > PAGE_SCHEMA_LIMITS.maxCanonicalBytes) {
    context.addIssue({
      code: "custom",
      path: [],
      message: `Страница превышает лимит ${PAGE_SCHEMA_LIMITS.maxCanonicalBytes} байт.`,
    });
  }
});

type SchemaPath = Array<string | number>;

function collectAssetIdPaths(
  value: unknown,
  path: SchemaPath,
  paths: SchemaPath[],
): void {
  if (Array.isArray(value)) {
    for (const [index, nested] of value.entries()) {
      collectAssetIdPaths(nested, [...path, index], paths);
    }
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = [...path, key];
    if (key === "assetId" && typeof nested === "string") {
      paths.push(nestedPath);
      continue;
    }
    collectAssetIdPaths(nested, nestedPath, paths);
  }
}

/**
 * Stage 1 has no upload/storage flow yet. Keeping this boundary separate from
 * the canonical schema lets later stages enable owned assets without a schema
 * migration while PATCH/publish stay fail-closed today.
 */
export const stageOnePageSchema = pageSchema.superRefine((page, context) => {
  const paths: SchemaPath[] = [];
  collectAssetIdPaths(page, [], paths);

  for (const path of paths) {
    context.addIssue({
      code: "custom",
      path,
      message:
        "Пользовательские изображения по assetId пока недоступны. Используйте встроенный demoAssetKey.",
    });
  }
});

export const pageSchemaV1 = pageSchema;
export const pageSchemaV1Schema = pageSchema;

export function parsePageSchema(input: unknown) {
  return pageSchema.parse(prepareUntrustedJson(input));
}

export function parseStageOnePageSchema(input: unknown) {
  return stageOnePageSchema.parse(prepareUntrustedJson(input));
}

export function safeParsePageSchema(input: unknown) {
  try {
    return pageSchema.safeParse(prepareUntrustedJson(input));
  } catch (error) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: "custom",
          path: [],
          message:
            error instanceof Error ? error.message : "Недопустимый JSON.",
        },
      ]),
    };
  }
}

function nonEmptyObject(value: object): boolean {
  return Object.keys(value).length > 0;
}

const blockStylePatchSchema = blockStyleSchema
  .partial()
  .refine(nonEmptyObject, {
    message: "Изменение оформления не может быть пустым.",
  });

function mutableBlockChangesSchema<
  TContent extends z.ZodType,
  TVariants extends readonly [string, ...string[]],
>(content: TContent, variants: TVariants) {
  return z
    .strictObject({
      variant: z.enum(variants).optional(),
      hidden: z.boolean().optional(),
      style: blockStylePatchSchema.optional(),
      content: content.optional(),
    })
    .refine(nonEmptyObject, {
      message: "Изменение блока не может быть пустым.",
    });
}

export const headerBlockChangesSchema = mutableBlockChangesSchema(
  headerContentSchema,
  ["simple", "centered", "with-cta"],
);
export const heroBlockChangesSchema = mutableBlockChangesSchema(
  heroContentSchema,
  ["centered", "image-right", "image-left", "full-background"],
);
export const featuresBlockChangesSchema = mutableBlockChangesSchema(
  featuresContentSchema,
  ["cards", "icons-grid", "numbered-list"],
);
export const servicesBlockChangesSchema = mutableBlockChangesSchema(
  servicesContentSchema,
  ["cards", "compact-list", "image-grid"],
);
export const aboutBlockChangesSchema = mutableBlockChangesSchema(
  aboutContentSchema,
  ["text", "image-right", "stats"],
);
export const stepsBlockChangesSchema = mutableBlockChangesSchema(
  stepsContentSchema,
  ["numbered", "timeline", "cards"],
);
export const galleryBlockChangesSchema = mutableBlockChangesSchema(
  galleryContentSchema,
  ["grid", "masonry", "carousel"],
);
export const testimonialsBlockChangesSchema = mutableBlockChangesSchema(
  testimonialsContentSchema,
  ["cards", "quotes", "featured"],
);
export const pricingBlockChangesSchema = mutableBlockChangesSchema(
  pricingContentSchema,
  ["single-offer", "cards", "simple-list"],
);
export const teamBlockChangesSchema = mutableBlockChangesSchema(
  teamContentSchema,
  ["cards", "compact", "featured"],
);
export const faqBlockChangesSchema = mutableBlockChangesSchema(
  faqContentSchema,
  ["accordion", "two-columns", "simple"],
);
export const ctaBlockChangesSchema = mutableBlockChangesSchema(
  ctaContentSchema,
  ["centered", "split", "banner"],
);
export const contactsBlockChangesSchema = mutableBlockChangesSchema(
  contactsContentSchema,
  ["details", "split", "mapless"],
);
export const leadFormBlockChangesSchema = mutableBlockChangesSchema(
  leadFormContentSchema,
  ["card", "split", "minimal"],
);
export const footerBlockChangesSchema = mutableBlockChangesSchema(
  footerContentSchema,
  ["simple", "columns", "with-brand"],
);

export const mutableBlockChangesUnionSchema = z.union([
  headerBlockChangesSchema,
  heroBlockChangesSchema,
  featuresBlockChangesSchema,
  servicesBlockChangesSchema,
  aboutBlockChangesSchema,
  stepsBlockChangesSchema,
  galleryBlockChangesSchema,
  testimonialsBlockChangesSchema,
  pricingBlockChangesSchema,
  teamBlockChangesSchema,
  faqBlockChangesSchema,
  ctaBlockChangesSchema,
  contactsBlockChangesSchema,
  leadFormBlockChangesSchema,
  footerBlockChangesSchema,
]);

export const updateBlockPatchSchema = z.strictObject({
  type: z.literal("updateBlock"),
  blockId: blockIdSchema,
  changes: mutableBlockChangesUnionSchema,
});

export const addBlockPatchSchema = z.strictObject({
  type: z.literal("addBlock"),
  afterBlockId: blockIdSchema.optional(),
  block: blockSchema,
});

export const removeBlockPatchSchema = z.strictObject({
  type: z.literal("removeBlock"),
  blockId: blockIdSchema,
});

export const moveBlockPatchSchema = z.strictObject({
  type: z.literal("moveBlock"),
  blockId: blockIdSchema,
  newIndex: z
    .number()
    .int()
    .min(0)
    .max(PAGE_SCHEMA_LIMITS.maxBlocks - 1),
});

export const updateSiteThemePatchSchema = z.strictObject({
  type: z.literal("updateSiteTheme"),
  changes: publishedSiteThemeSchema.partial().refine(nonEmptyObject, {
    message: "Изменение темы не может быть пустым.",
  }),
});

export const updateSeoPatchSchema = z.strictObject({
  type: z.literal("updateSeo"),
  changes: seoSchema
    .partial()
    .refine(nonEmptyObject, { message: "Изменение SEO не может быть пустым." }),
});

export const pagePatchOperationSchema = z.discriminatedUnion("type", [
  updateBlockPatchSchema,
  addBlockPatchSchema,
  removeBlockPatchSchema,
  moveBlockPatchSchema,
  updateSiteThemePatchSchema,
  updateSeoPatchSchema,
]);

export const blockPatchSchema = updateBlockPatchSchema;

/** A PagePatch is an ordered, bounded list of closed operations. */
export const pagePatchSchema = z
  .array(pagePatchOperationSchema)
  .min(1)
  .max(PAGE_SCHEMA_LIMITS.maxPatchOperations);

export const pagePatchEnvelopeSchema = z.strictObject({
  operations: pagePatchSchema,
});

// Co-located aliases keep validation-boundary imports ergonomic; the canonical
// type barrel remains `@/types/page-schema`.
export type PublishedSiteTheme = z.infer<typeof publishedSiteThemeSchema>;
export type SeoSchema = z.infer<typeof seoSchema>;
export type LinkAction = z.infer<typeof linkActionSchema>;
export type ButtonSchema = z.infer<typeof buttonSchema>;
export type FormFieldSchema = z.infer<typeof formFieldSchema>;
export type BlockSchema = z.infer<typeof blockSchema>;
export type PageSchema = z.infer<typeof pageSchema>;
export type PageSchemaV1 = PageSchema;
export type PagePatchOperation = z.infer<typeof pagePatchOperationSchema>;
export type PagePatch = z.infer<typeof pagePatchSchema>;
