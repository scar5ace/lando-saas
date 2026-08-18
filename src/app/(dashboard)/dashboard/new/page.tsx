import { GenerationFlow } from "@/components/dashboard/generation-flow";

export default function NewProjectPage() {
  return (
    <main className="px-4 py-10 md:py-16">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <p className="text-sm font-semibold text-[var(--ai-accent)]">
          Создание с AI
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Что будем создавать?
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Расскажите о бизнесе, аудитории, нужных блоках и желаемом стиле.
        </p>
      </div>
      <GenerationFlow />
    </main>
  );
}
