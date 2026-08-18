"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  LoaderCircle,
  Monitor,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
} from "lucide-react";
import { z } from "zod";

import {
  blockTypeLabels,
  duplicateBlock,
  getBlockPrimaryText,
  getBlockPrimaryTextLimit,
  moveBlock,
  replaceBlock,
  updateBlockPrimaryText,
} from "@/components/editor/editor-block-utils";
import { SiteRenderer } from "@/components/public-site/site-renderer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PAGE_SCHEMA_LIMITS, pageSchema } from "@/lib/validation/page-schema";
import type { BlockSchema, PageSchema } from "@/types";

const detailResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    project: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    }),
    page: z.object({
      schema: pageSchema,
      revision: z.number().int().nonnegative(),
      publishedAt: z.string().nullable(),
    }),
  }),
});

const revisionResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    page: z.object({ revision: z.number().int().nonnegative() }),
  }),
});
const publishResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    publicUrl: z.string().optional(),
    page: z
      .object({
        publishedAt: z.string().nullable().optional(),
        revision: z.number().int().optional(),
      })
      .optional(),
  }),
});
const errorResponseSchema = z.object({
  error: z.object({ message: z.string() }),
});

type Detail = z.infer<typeof detailResponseSchema>["data"];
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type Viewport = "desktop" | "tablet" | "mobile";

function messageFromPayload(payload: unknown, fallback: string): string {
  const result = errorResponseSchema.safeParse(payload);
  return result.success ? result.data.error.message : fallback;
}

function viewportWidth(viewport: Viewport): string {
  if (viewport === "mobile") return "390px";
  if (viewport === "tablet") return "768px";
  return "1200px";
}

export function EditorShell({ projectId }: { projectId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [page, setPage] = useState<PageSchema | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const pageRef = useRef<PageSchema | null>(null);
  const revisionRef = useRef(0);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const publishingRef = useRef(false);
  const conflictRef = useRef(false);
  const savedFingerprintRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { Accept: "application/json" },
      });
      const payload: unknown = await response.json();
      const parsed = detailResponseSchema.safeParse(payload);
      if (!response.ok || !parsed.success)
        throw new Error(
          messageFromPayload(payload, "Не удалось открыть проект."),
        );
      setDetail(parsed.data.data);
      setPage(parsed.data.data.page.schema);
      pageRef.current = parsed.data.data.page.schema;
      revisionRef.current = parsed.data.data.page.revision;
      savedFingerprintRef.current = JSON.stringify(
        parsed.data.data.page.schema,
      );
      conflictRef.current = false;
      setHasConflict(false);
      setSelectedBlockId(
        parsed.data.data.page.schema.blocks.find(
          (block) => !block.hidden && block.type !== "header",
        )?.id ?? null,
      );
      setSaveState("saved");
    } catch (loadError) {
      setMessage(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось открыть проект.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const persist = useCallback(
    async function saveSnapshot(snapshot: PageSchema): Promise<boolean> {
      if (conflictRef.current) return false;
      if (savingRef.current) {
        queuedRef.current = true;
        return false;
      }
      savingRef.current = true;
      setSaveState("saving");
      setMessage(null);
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            schema: snapshot,
            revision: revisionRef.current,
          }),
        });
        const payload: unknown = await response.json();
        const parsed = revisionResponseSchema.safeParse(payload);
        if (!response.ok || !parsed.success) {
          if (response.status === 409) {
            queuedRef.current = false;
            conflictRef.current = true;
            setHasConflict(true);
          }
          throw new Error(
            messageFromPayload(payload, "Не удалось сохранить изменения."),
          );
        }
        revisionRef.current = parsed.data.data.page.revision;
        savedFingerprintRef.current = JSON.stringify(snapshot);
        setDetail((current) =>
          current
            ? {
                ...current,
                page: {
                  ...current.page,
                  revision: parsed.data.data.page.revision,
                },
              }
            : current,
        );
        const currentPage = pageRef.current;
        const unchanged =
          currentPage !== null &&
          JSON.stringify(currentPage) === JSON.stringify(snapshot);
        setSaveState(unchanged ? "saved" : "dirty");
        if (!unchanged) queuedRef.current = true;
        return true;
      } catch (saveError) {
        setSaveState("error");
        setMessage(
          saveError instanceof Error
            ? saveError.message
            : "Не удалось сохранить изменения.",
        );
        return false;
      } finally {
        savingRef.current = false;
        const queuedSnapshot = pageRef.current;
        if (queuedRef.current && queuedSnapshot) {
          window.setTimeout(() => {
            queuedRef.current = false;
            void saveSnapshot(structuredClone(queuedSnapshot));
          }, 0);
        } else if (queuedRef.current) {
          queuedRef.current = false;
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (!page || saveState !== "dirty") return;
    const timer = window.setTimeout(
      () => void persist(structuredClone(page)),
      900,
    );
    return () => window.clearTimeout(timer);
  }, [page, persist, saveState]);

  useEffect(() => {
    function preventLoss(event: BeforeUnloadEvent) {
      if (
        saveState === "dirty" ||
        saveState === "saving" ||
        saveState === "error"
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [saveState]);

  const selectedBlock = useMemo(
    () => page?.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [page, selectedBlockId],
  );

  function updatePage(next: PageSchema): boolean {
    if (publishingRef.current) return false;
    if (conflictRef.current) {
      setMessage(
        "Сначала загрузите актуальную версию с сервера: этот черновик изменён в другой вкладке.",
      );
      return false;
    }

    const parsed = pageSchema.safeParse(next);
    if (!parsed.success) {
      setMessage(
        parsed.error.issues[0]?.message ??
          "Это изменение сделает страницу некорректной.",
      );
      return false;
    }

    pageRef.current = parsed.data;
    setPage(parsed.data);
    setSaveState("dirty");
    setMessage(null);
    return true;
  }

  function updateSelected(replacement: BlockSchema) {
    if (!page || !selectedBlockId) return;
    updatePage(replaceBlock(page, selectedBlockId, replacement));
  }

  async function waitForSaveQueue(timeoutMs = 20_000): Promise<boolean> {
    const startedAt = Date.now();

    while (savingRef.current || queuedRef.current) {
      if (Date.now() - startedAt >= timeoutMs) return false;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
    }

    return true;
  }

  async function flushLatestDraft(): Promise<number | null> {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (!(await waitForSaveQueue())) return null;

      const currentPage = pageRef.current;
      if (!currentPage) return null;
      const currentFingerprint = JSON.stringify(currentPage);

      if (savedFingerprintRef.current === currentFingerprint) {
        return revisionRef.current;
      }

      const saved = await persist(structuredClone(currentPage));
      if (!saved && !savingRef.current && !queuedRef.current) return null;
    }

    return null;
  }

  async function publish() {
    if (publishingRef.current || !pageRef.current) return;
    publishingRef.current = true;
    setPublishing(true);
    setMessage(null);

    try {
      const revision = await flushLatestDraft();
      if (revision === null) {
        throw new Error(
          "Не удалось завершить сохранение перед публикацией. Изменения остались в редакторе — попробуйте ещё раз.",
        );
      }

      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ revision }),
      });
      const payload: unknown = await response.json();
      const parsed = publishResponseSchema.safeParse(payload);
      if (!response.ok || !parsed.success)
        throw new Error(
          messageFromPayload(payload, "Не удалось опубликовать сайт."),
        );
      setDetail((current) =>
        current
          ? {
              ...current,
              project: { ...current.project, status: "PUBLISHED" },
              page: {
                ...current.page,
                publishedAt:
                  parsed.data.data.page?.publishedAt ??
                  new Date().toISOString(),
              },
            }
          : current,
      );
      setMessage("Сайт опубликован. Публичная версия обновлена.");
    } catch (publishError) {
      setMessage(
        publishError instanceof Error
          ? publishError.message
          : "Не удалось опубликовать сайт.",
      );
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  }

  async function unpublish() {
    if (publishingRef.current) return;
    publishingRef.current = true;
    setPublishing(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const payload: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          messageFromPayload(payload, "Не удалось снять сайт с публикации."),
        );
      setDetail((current) =>
        current
          ? {
              ...current,
              project: { ...current.project, status: "DRAFT" },
              page: { ...current.page, publishedAt: null },
            }
          : current,
      );
      setMessage("Сайт снят с публикации. Черновик сохранён.");
    } catch (unpublishError) {
      setMessage(
        unpublishError instanceof Error
          ? unpublishError.message
          : "Не удалось снять сайт с публикации.",
      );
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  }

  if (loading)
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-[var(--primary)]" />
        <span className="sr-only">Загрузка редактора</span>
      </main>
    );
  if (!page || !detail)
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">Проект не открылся</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          {message ?? "Попробуйте вернуться к списку проектов."}
        </p>
        <Button className="mt-6" variant="outline" onClick={() => void load()}>
          Повторить
        </Button>
      </main>
    );

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col bg-slate-100">
      <div className="flex min-h-14 flex-wrap items-center gap-3 border-b border-[var(--border-default)] bg-white px-3 py-2 md:px-4">
        <a
          href="/dashboard"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Назад к проектам"
        >
          <ArrowLeft className="size-5" />
        </a>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{detail.project.name}</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            /{detail.project.slug}
          </p>
        </div>
        <div
          className="mx-auto flex rounded-[10px] border border-[var(--border-default)] bg-slate-50 p-1"
          aria-label="Размер предпросмотра"
        >
          {(["desktop", "tablet", "mobile"] as const).map((mode) => {
            const Icon =
              mode === "desktop"
                ? Monitor
                : mode === "tablet"
                  ? Tablet
                  : Smartphone;
            return (
              <button
                key={mode}
                onClick={() => setViewport(mode)}
                className={cn(
                  "rounded-md p-2",
                  viewport === mode
                    ? "bg-white text-[var(--primary)] shadow-sm"
                    : "text-slate-400",
                )}
                aria-label={
                  mode === "desktop"
                    ? "Компьютер"
                    : mode === "tablet"
                      ? "Планшет"
                      : "Телефон"
                }
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 text-xs text-[var(--text-secondary)] sm:flex">
            {saveState === "saving" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : saveState === "saved" ? (
              <Check className="size-3.5 text-[var(--success)]" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saveState === "saving"
              ? "Сохраняем…"
              : saveState === "saved"
                ? "Сохранено"
                : saveState === "error"
                  ? "Ошибка"
                  : "Есть изменения"}
          </span>
          {detail.project.status === "PUBLISHED" ? (
            <Link
              href={`/s/${detail.project.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Открыть <ExternalLink className="size-4" />
            </Link>
          ) : null}
          <Button
            size="sm"
            disabled={publishing || saveState === "saving"}
            onClick={() => void publish()}
          >
            {publishing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            {detail.project.status === "PUBLISHED"
              ? "Обновить"
              : "Опубликовать"}
          </Button>
        </div>
      </div>

      {message ? (
        <div
          role="status"
          className={cn(
            "flex flex-wrap items-center justify-center gap-3 border-b px-4 py-2 text-center text-sm",
            saveState === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-100 bg-blue-50 text-blue-800",
          )}
        >
          <span>{message}</span>
          {hasConflict ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  window.confirm(
                    "Локальные несохранённые изменения будут заменены актуальной версией с сервера. Продолжить?",
                  )
                ) {
                  conflictRef.current = false;
                  setHasConflict(false);
                  void load();
                }
              }}
            >
              Загрузить актуальную версию
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_330px]">
        <aside className="border-r border-[var(--border-default)] bg-white p-3 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <div className="mb-3 flex items-center justify-between px-2">
            <h2 className="text-sm font-bold">Блоки</h2>
            <Badge>{page.blocks.length}</Badge>
          </div>
          <ol className="space-y-1">
            {page.blocks.map((block, index) => (
              <li key={block.id}>
                <button
                  onClick={() => setSelectedBlockId(block.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm",
                    selectedBlockId === block.id
                      ? "border-[var(--primary-border)] bg-[var(--primary-subtle)] text-[var(--primary-active)]"
                      : "border-transparent hover:bg-slate-50",
                    block.hidden && "opacity-50",
                  )}
                >
                  <span className="w-5 text-xs text-[var(--text-tertiary)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {blockTypeLabels[block.type]}
                  </span>
                  {block.hidden ? <EyeOff className="size-3.5" /> : null}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section
          className="min-w-0 overflow-auto p-4 md:p-6"
          aria-label="Предпросмотр сайта"
        >
          <div
            className="mx-auto min-h-full overflow-hidden rounded-[14px] bg-white shadow-xl transition-[width] duration-200"
            style={{ width: viewportWidth(viewport) }}
          >
            <SiteRenderer
              page={page}
              editorMode
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
            />
          </div>
        </section>

        <aside className="border-l border-[var(--border-default)] bg-white p-5 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          {selectedBlock ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">
                  {blockTypeLabels[selectedBlock.type]}
                </p>
                <h2 className="mt-1 text-lg font-bold">Настройки блока</h2>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="block-title">Основной текст</Label>
                <Input
                  id="block-title"
                  value={getBlockPrimaryText(selectedBlock)}
                  maxLength={getBlockPrimaryTextLimit(selectedBlock)}
                  onChange={(event) =>
                    updateSelected(
                      updateBlockPrimaryText(selectedBlock, event.target.value),
                    )
                  }
                />
                <p className="text-xs text-[var(--text-tertiary)]">
                  Текст сохраняется автоматически.
                </p>
              </div>
              <div className="grid gap-3">
                <Label>Действия</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page.blocks[0]?.id === selectedBlock.id}
                    onClick={() =>
                      updatePage(moveBlock(page, selectedBlock.id, -1))
                    }
                  >
                    <ArrowUp className="size-4" /> Выше
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page.blocks.at(-1)?.id === selectedBlock.id}
                    onClick={() =>
                      updatePage(moveBlock(page, selectedBlock.id, 1))
                    }
                  >
                    <ArrowDown className="size-4" /> Ниже
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      page.blocks.length >= PAGE_SCHEMA_LIMITS.maxBlocks
                    }
                    onClick={() => {
                      const result = duplicateBlock(page, selectedBlock.id);
                      if (updatePage(result.page))
                        setSelectedBlockId(result.newBlockId);
                    }}
                  >
                    <Copy className="size-4" /> Дублировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateSelected({
                        ...selectedBlock,
                        hidden: !selectedBlock.hidden,
                      })
                    }
                  >
                    {selectedBlock.hidden ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                    {selectedBlock.hidden ? "Показать" : "Скрыть"}
                  </Button>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const blocks = page.blocks.filter(
                      (block) => block.id !== selectedBlock.id,
                    );
                    if (blocks.length === 0) return;
                    if (updatePage({ ...page, blocks }))
                      setSelectedBlockId(blocks[0]?.id ?? null);
                  }}
                >
                  <Trash2 className="size-4" /> Удалить блок
                </Button>
              </div>
              <div className="border-t border-[var(--border-default)] pt-5">
                <Label>Тема сайта</Label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs text-[var(--text-secondary)]">
                    Основной цвет
                    <input
                      type="color"
                      value={page.site.theme.primaryColor}
                      onChange={(event) =>
                        updatePage({
                          ...page,
                          site: {
                            ...page.site,
                            theme: {
                              ...page.site.theme,
                              primaryColor: event.target.value.toUpperCase(),
                            },
                          },
                        })
                      }
                      className="h-10 w-full rounded border"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-[var(--text-secondary)]">
                    Фон
                    <input
                      type="color"
                      value={page.site.theme.backgroundColor}
                      onChange={(event) =>
                        updatePage({
                          ...page,
                          site: {
                            ...page.site,
                            theme: {
                              ...page.site.theme,
                              backgroundColor: event.target.value.toUpperCase(),
                            },
                          },
                        })
                      }
                      className="h-10 w-full rounded border"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Выберите блок в списке или предпросмотре.
            </p>
          )}
          <div className="mt-8 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-4">
            <div className="flex items-center gap-2 font-semibold text-[var(--ai-accent)]">
              <Sparkles className="size-4" /> AI-правки
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              Безопасные AI-команды подключаются на следующем этапе редактора.
            </p>
          </div>
          {detail.project.status === "PUBLISHED" ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-6 w-full text-[var(--danger)]"
              disabled={publishing}
              onClick={() => void unpublish()}
            >
              Снять с публикации
            </Button>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
