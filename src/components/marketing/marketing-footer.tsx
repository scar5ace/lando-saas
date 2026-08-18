import Link from "next/link";

import { productConfig } from "@/config/product";

import { ProductMark } from "./product-mark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border-default)] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="space-y-3">
          <ProductMark />
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            {productConfig.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--text-secondary)]">
          <a className="hover:text-[var(--text-primary)]" href="#faq">
            Вопросы
          </a>
          <Link className="hover:text-[var(--text-primary)]" href="/login">
            Вход
          </Link>
          <Link className="hover:text-[var(--text-primary)]" href="/register">
            Регистрация
          </Link>
        </div>
      </div>
      <div className="border-t border-[var(--border-default)] px-4 py-5 text-center text-xs text-[var(--text-tertiary)]">
        © {new Date().getFullYear()} {productConfig.name}. Конструктор
        одностраничных сайтов.
      </div>
    </footer>
  );
}
