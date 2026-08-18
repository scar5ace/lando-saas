import Link from "next/link";
import { Plus } from "lucide-react";

import { ProjectsOverview } from "@/components/dashboard/projects-overview";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">
            Личный кабинет
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Ваши проекты
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Черновики и опубликованные лендинги в одном месте.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className={cn(buttonVariants(), "hidden sm:inline-flex")}
        >
          <Plus className="size-4" /> Новый сайт
        </Link>
      </div>
      <ProjectsOverview />
    </main>
  );
}
