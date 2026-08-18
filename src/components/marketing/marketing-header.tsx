import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ProductMark } from "./product-mark";

const registerHref = "/register?next=%2Fdashboard%2Fnew";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-default)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <ProductMark />

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-[var(--text-secondary)] md:flex"
          aria-label="Основная навигация"
        >
          <a
            className="transition-colors hover:text-[var(--text-primary)]"
            href="#how-it-works"
          >
            Как это работает
          </a>
          <a
            className="transition-colors hover:text-[var(--text-primary)]"
            href="#examples"
          >
            Возможности
          </a>
          <a
            className="transition-colors hover:text-[var(--text-primary)]"
            href="#pricing"
          >
            Тарифы
          </a>
          <a
            className="transition-colors hover:text-[var(--text-primary)]"
            href="#faq"
          >
            Вопросы
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login?next=%2Fdashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Войти
          </Link>
          <Link href={registerHref} className={buttonVariants({ size: "sm" })}>
            Начать бесплатно
          </Link>
        </div>
      </div>
    </header>
  );
}
