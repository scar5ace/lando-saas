import type { MetadataRoute } from "next";

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

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/s/"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
    host: baseUrl.origin,
  };
}
