import Link from "next/link";
import { Plus } from "lucide-react";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { cn } from "@/lib/utils";

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-default)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]"
        >
          {productConfig.name}
        </Link>
        <nav
          aria-label="Личный кабинет"
          className="ml-4 hidden items-center gap-1 md:flex"
        >
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)]"
          >
            Проекты
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden max-w-52 truncate text-sm text-[var(--text-secondary)] sm:block">
            {email}
          </span>
          <Link
            href="/dashboard/new"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            <Plus className="size-4" aria-hidden="true" /> Новый сайт
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
