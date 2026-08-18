import type { z } from "zod";

import type {
  blockPatchSchema,
  blockSchema,
  buttonSchema,
  formFieldSchema,
  imageRefSchema,
  linkActionSchema,
  pagePatchEnvelopeSchema,
  pagePatchOperationSchema,
  pagePatchSchema,
  pageSchema,
  publishedSiteThemeSchema,
  seoSchema,
  siteSchema,
} from "@/lib/validation/page-schema";

export type PublishedSiteTheme = z.infer<typeof publishedSiteThemeSchema>;
export type SeoSchema = z.infer<typeof seoSchema>;
export type LinkAction = z.infer<typeof linkActionSchema>;
export type ButtonSchema = z.infer<typeof buttonSchema>;
export type ImageRef = z.infer<typeof imageRefSchema>;
export type FormFieldSchema = z.infer<typeof formFieldSchema>;
export type SiteSchema = z.infer<typeof siteSchema>;
export type BlockSchema = z.infer<typeof blockSchema>;
export type PageSchema = z.infer<typeof pageSchema>;
export type PageSchemaV1 = PageSchema;
export type PagePatchOperation = z.infer<typeof pagePatchOperationSchema>;
export type PagePatch = z.infer<typeof pagePatchSchema>;
export type PagePatchEnvelope = z.infer<typeof pagePatchEnvelopeSchema>;
export type BlockPatch = z.infer<typeof blockPatchSchema>;

export type BlockType = BlockSchema["type"];

export type BlockOfType<TType extends BlockType> = Extract<
  BlockSchema,
  { type: TType }
>;
