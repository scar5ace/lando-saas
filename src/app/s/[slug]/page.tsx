import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SiteRenderer } from "@/components/public-site/site-renderer";
import { ProjectStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { parsePageSchema } from "@/lib/validation/page-schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublishedSitePageProps = {
  params: Promise<{ slug: string }>;
};

const publicSlugPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const readPublishedSite = cache(async (slug: string) => {
  if (!publicSlugPattern.test(slug)) return null;

  const project = await db.project.findFirst({
    where: {
      slug,
      status: ProjectStatus.PUBLISHED,
      page: { is: { publishedAt: { not: null } } },
    },
    select: {
      page: {
        select: {
          publishedAt: true,
          publishedSchema: true,
        },
      },
    },
  });

  if (!project?.page?.publishedAt || project.page.publishedSchema === null) {
    return null;
  }

  try {
    return {
      page: parsePageSchema(project.page.publishedSchema),
      publishedAt: project.page.publishedAt,
    };
  } catch {
    // Invalid stored snapshots are indistinguishable from an absent publish.
    // Database failures intentionally remain 500 responses for observability.
    return null;
  }
});

async function requirePublishedSite(slug: string) {
  const publishedSite = await readPublishedSite(slug);
  if (!publishedSite) notFound();
  return publishedSite;
}

export async function generateMetadata({
  params,
}: PublishedSitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await requirePublishedSite(slug);
  const canonicalUrl =
    page.site.seo.canonicalUrl ?? `/s/${encodeURIComponent(slug)}`;

  return {
    title: page.site.seo.title,
    description: page.site.seo.description,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: page.site.seo.indexing,
      follow: page.site.seo.indexing,
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      title: page.site.seo.title,
      description: page.site.seo.description,
      url: canonicalUrl,
    },
    twitter: {
      card: "summary",
      title: page.site.seo.title,
      description: page.site.seo.description,
    },
  };
}

export default async function PublishedSitePage({
  params,
}: PublishedSitePageProps) {
  const { slug } = await params;
  const { page } = await requirePublishedSite(slug);

  return <SiteRenderer page={page} className="min-h-screen" />;
}
