import type { Metadata, Viewport } from "next";

import { productConfig } from "@/config/product";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL?.trim() || "http://localhost:3000"),
  title: {
    default: `${productConfig.name} — ${productConfig.slogan.toLocaleLowerCase("ru")}`,
    template: `%s · ${productConfig.name}`,
  },
  description: productConfig.description,
  applicationName: productConfig.name,
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#F7F8FA",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
