"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Command, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { PENDING_PROMPT_STORAGE_KEY } from "./pending-prompt";

const examples = [
  "Лендинг для семейного фотографа в Казани",
  "Сайт мастера по установке кондиционеров",
  "Страница курса по дизайну интерьера",
] as const;

type PromptComposerProps = {
  promptLimit: number;
};

export function PromptComposer({ promptLimit }: PromptComposerProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedPrompt = prompt.trim();
  const isNearLimit = prompt.length >= promptLimit * 0.8;

  function submitPrompt() {
    if (!trimmedPrompt) {
      setError("Опишите, какой сайт вы хотите создать.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      sessionStorage.setItem(PENDING_PROMPT_STORAGE_KEY, trimmedPrompt);
      router.push("/register?next=%2Fdashboard%2Fnew");
    } catch {
      setIsSubmitting(false);
      setError(
        "Не удалось сохранить запрос в браузере. Разрешите хранение данных для этого сайта и попробуйте снова.",
      );
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <form
        className="rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-white p-2.5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)] sm:p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitPrompt();
        }}
        aria-busy={isSubmitting}
      >
        <label className="sr-only" htmlFor="site-prompt">
          Опишите сайт, который хотите создать
        </label>
        <Textarea
          id="site-prompt"
          name="prompt"
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Например: создайте светлый лендинг для семейного фотографа в Казани — с услугами, ценами, отзывами и формой записи"
          className="min-h-[140px] resize-none border-0 px-3 py-3 text-base leading-7 shadow-none focus:ring-0 sm:text-lg"
          maxLength={promptLimit}
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "prompt-error prompt-hint" : "prompt-hint"}
          aria-keyshortcuts="Control+Enter Meta+Enter"
        />

        <div className="flex flex-col gap-3 border-t border-[var(--border-default)] px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            id="prompt-hint"
            className="flex min-h-5 items-center text-xs text-[var(--text-tertiary)]"
          >
            {isNearLimit ? (
              <span aria-live="polite">
                {prompt.length.toLocaleString("ru-RU")} из{" "}
                {promptLimit.toLocaleString("ru-RU")} символов
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Command className="size-3.5" aria-hidden="true" />
                Ctrl / ⌘ + Enter
              </span>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {isSubmitting ? "Сохраняем запрос…" : "Создать сайт"}
            {!isSubmitting && (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </form>

      {error && (
        <p
          id="prompt-error"
          className="mt-3 text-sm font-medium text-[var(--danger)]"
          role="alert"
        >
          {error}
        </p>
      )}

      <div
        className="mt-5 flex flex-wrap items-center justify-center gap-2"
        aria-label="Примеры запросов"
      >
        <span className="mr-1 text-xs font-medium text-[var(--text-tertiary)]">
          Попробуйте пример:
        </span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            className="rounded-full border border-[var(--border-default)] bg-white px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary-active)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] sm:text-sm"
            onClick={() => {
              setPrompt(example);
              setError(null);
            }}
            disabled={isSubmitting}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
