"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { productConfig } from "@/config/product";

const PENDING_PROMPT_KEY = "lando.pendingPrompt";
const phases = [
  "Изучаем описание",
  "Создаём структуру",
  "Готовим тексты",
  "Подбираем оформление",
  "Собираем сайт",
] as const;

const createResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({ project: z.object({ id: z.string() }) }),
});

const errorResponseSchema = z.object({
  error: z.object({ message: z.string() }),
});

export function GenerationFlow() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const stored = sessionStorage.getItem(PENDING_PROMPT_KEY);
    queueMicrotask(() => {
      if (mounted.current && stored) {
        setPrompt(stored.slice(0, productConfig.promptLimit));
      }
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  async function generate() {
    const normalized = prompt.trim();
    if (normalized.length < 20) {
      setError("Опишите сайт чуть подробнее — минимум 20 символов.");
      return;
    }

    setError(null);
    setPhase(0);
    const timers = phases
      .slice(1)
      .map((_, index) =>
        window.setTimeout(
          () => mounted.current && setPhase(index + 1),
          650 * (index + 1),
        ),
      );

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ prompt: normalized }),
      });
      const payload: unknown = await response.json();
      const parsed = createResponseSchema.safeParse(payload);
      if (!response.ok || !parsed.success) {
        const parsedError = errorResponseSchema.safeParse(payload);
        throw new Error(
          parsedError.success
            ? parsedError.data.error.message
            : "Не удалось создать проект.",
        );
      }
      sessionStorage.removeItem(PENDING_PROMPT_KEY);
      setPhase(phases.length);
      router.replace(
        `/dashboard/projects/${parsed.data.data.project.id}/editor`,
      );
    } catch (generationError) {
      setPhase(null);
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Не удалось создать проект.",
      );
    } finally {
      timers.forEach(window.clearTimeout);
    }
  }

  if (phase !== null) {
    return (
      <div
        className="mx-auto max-w-2xl rounded-[20px] border border-[var(--ai-border)] bg-white p-6 shadow-sm md:p-10"
        aria-live="polite"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--ai-surface)] text-[var(--ai-accent)]">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-bold">Lando создаёт сайт</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Можно не обновлять страницу
            </p>
          </div>
        </div>
        <ol className="space-y-3">
          {phases.map((label, index) => {
            const complete = phase > index;
            const active = phase === index;
            return (
              <li
                key={label}
                className={`flex items-center gap-3 rounded-xl border p-4 ${active ? "border-[var(--ai-border)] bg-[var(--ai-surface)]" : "border-transparent"}`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full ${complete ? "bg-[var(--success)] text-white" : active ? "bg-[var(--ai-accent)] text-white" : "bg-slate-100 text-slate-400"}`}
                >
                  {complete ? (
                    <Check className="size-4" />
                  ) : active ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={
                    active ? "font-semibold" : "text-[var(--text-secondary)]"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[20px] border border-[var(--border-default)] bg-white p-5 shadow-sm md:p-8">
      <label htmlFor="project-prompt" className="text-sm font-semibold">
        Опишите сайт, который хотите создать
      </label>
      <Textarea
        id="project-prompt"
        value={prompt}
        onChange={(event) =>
          setPrompt(event.target.value.slice(0, productConfig.promptLimit))
        }
        placeholder="Например: современный лендинг для мастера по установке кондиционеров в Саратове…"
        className="mt-3 min-h-44"
        disabled={phase !== null}
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs text-[var(--text-tertiary)]">
          В локальном режиме работает безопасный mock-AI
        </p>
        <span className="text-xs text-[var(--text-tertiary)]">
          {prompt.length}/{productConfig.promptLimit}
        </span>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-[var(--danger-surface)] p-3 text-sm text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}
      <Button
        variant="ai"
        size="lg"
        className="mt-5 w-full"
        onClick={() => void generate()}
      >
        <Sparkles className="size-5" /> Создать сайт
      </Button>
    </div>
  );
}
