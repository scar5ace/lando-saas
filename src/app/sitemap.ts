import type { MetadataRoute } from "next";

import { ProjectStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { parsePageSchema } from "@/lib/validation/page-schema";

export const dynamic = "force-dynamic";

const publicSlugPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function publicBaseUrl() {
  const fallback = new URL("http://localhost:3000");
  const configured = process.env.APP_URL?.trim();
  if (!configured) return fallback;

  try {
    const url = new URL(configured);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url
      : fallback;
  } catch {
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = publicBaseUrl();
  const entries: MetadataRoute.Sitemap = [
    {
      url: new URL("/", baseUrl).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    const projects = await db.project.findMany({
      where: {
        status: ProjectStatus.PUBLISHED,
        page: { is: { publishedAt: { not: null } } },
      },
      select: {
        slug: true,
        page: {
          select: {
            publishedAt: true,
            publishedSchema: true,
          },
        },
      },
      orderBy: { slug: "asc" },
      take: 49_999,
    });

    for (const project of projects) {
      if (
        !publicSlugPattern.test(project.slug) ||
        !project.page?.publishedAt ||
        project.page.publishedSchema === null
      ) {
        continue;
      }

      try {
        const page = parsePageSchema(project.page.publishedSchema);
        if (!page.site.seo.indexing) continue;

        entries.push({
          url: new URL(
            `/s/${encodeURIComponent(project.slug)}`,
            baseUrl,
          ).toString(),
          lastModified: project.page.publishedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      } catch {
        // Invalid snapshots never enter the public sitemap.
      }
    }
  } catch {
    // The marketing page remains discoverable while the database is unavailable.
  }

  return entries;
}
