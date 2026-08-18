"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  Globe2,
  LoaderCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  updatedAt: z.string(),
});

const projectsResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({ projects: z.array(projectSchema) }),
});

const deleteResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({ projectId: z.string() }),
});

const errorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.object({ message: z.string() }),
});

type ProjectSummary = z.infer<typeof projectSchema>;

export function ProjectsOverview() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(
    null,
  );
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );

  async function deleteProject(project: ProjectSummary) {
    setDeletingProjectId(project.id);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const payload: unknown = await response.json();
      const parsed = deleteResponseSchema.safeParse(payload);
      if (!response.ok || !parsed.success) {
        const parsedError = errorResponseSchema.safeParse(payload);
        throw new Error(
          parsedError.success
            ? parsedError.data.error.message
            : "Не удалось удалить проект. Попробуйте ещё раз.",
        );
      }

      setProjects((current) =>
        current.filter((item) => item.id !== parsed.data.data.projectId),
      );
      setPendingDelete(null);
    } catch (deleteProjectError) {
      setDeleteError(
        deleteProjectError instanceof Error
          ? deleteProjectError.message
          : "Не удалось удалить проект. Попробуйте ещё раз.",
      );
    } finally {
      setDeletingProjectId(null);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        headers: { Accept: "application/json" },
      });
      const payload: unknown = await response.json();
      const parsed = projectsResponseSchema.safeParse(payload);
      if (!response.ok || !parsed.success)
        throw new Error("Не удалось получить список проектов.");
      setProjects(parsed.data.data.projects);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось получить список проектов.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) {
    return (
      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Загрузка проектов"
      >
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-52 animate-pulse rounded-[14px] border border-[var(--border-default)] bg-white"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-[var(--danger)]">{error}</p>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="size-4" /> Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[var(--primary-subtle)] text-[var(--primary)]">
            <FilePlus2 className="size-7" />
          </span>
          <h2 className="text-xl font-bold">Создайте первый сайт</h2>
          <p className="mt-2 max-w-md text-[var(--text-secondary)]">
            Опишите задачу обычными словами — mock-AI подготовит безопасную
            первую версию без внешнего ключа.
          </p>
          <Link href="/dashboard/new" className={cn(buttonVariants(), "mt-6")}>
            Создать сайт <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {deleteError ? (
        <div
          className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {deleteError}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="h-28 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5">
              <div className="h-full rounded-lg border border-blue-100 bg-white/70 p-3">
                <div className="h-2 w-24 rounded bg-blue-200" />
                <div className="mt-3 h-2 w-4/5 rounded bg-slate-200" />
                <div className="mt-2 h-2 w-3/5 rounded bg-slate-100" />
              </div>
            </div>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{project.name}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    /{project.slug}
                  </p>
                </div>
                <Badge
                  className={
                    project.status === "PUBLISHED"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : undefined
                  }
                >
                  {project.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <time
                  className="text-xs text-[var(--text-tertiary)]"
                  dateTime={project.updatedAt}
                >
                  Обновлён{" "}
                  {new Intl.DateTimeFormat("ru", {
                    day: "numeric",
                    month: "short",
                  }).format(new Date(project.updatedAt))}
                </time>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-[var(--text-tertiary)] hover:bg-red-50 hover:text-[var(--danger)]"
                    aria-label={`Удалить проект «${project.name}»`}
                    title="Удалить проект"
                    onClick={() => {
                      setDeleteError(null);
                      setPendingDelete(project);
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                  <Link
                    href={`/dashboard/projects/${project.id}/editor`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)]"
                  >
                    Открыть <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
              {project.status === "PUBLISHED" ? (
                <Link
                  href={`/s/${project.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]"
                >
                  <Globe2 className="size-3.5" /> Открыть сайт
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              deletingProjectId === null
            ) {
              setPendingDelete(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-[14px] border border-[var(--border-default)] bg-white p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            aria-describedby="delete-project-description"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-project-title" className="text-xl font-bold">
                  Удалить проект?
                </h2>
                <p
                  id="delete-project-description"
                  className="mt-3 text-sm leading-6 text-[var(--text-secondary)]"
                >
                  Проект «{pendingDelete.name}» и все его страницы будут
                  удалены. Восстановить их будет невозможно.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="-mt-2 -mr-2"
                aria-label="Закрыть окно"
                disabled={deletingProjectId !== null}
                onClick={() => setPendingDelete(null)}
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            {pendingDelete.status === "PUBLISHED" ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Опубликованный сайт сразу перестанет открываться.
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={deletingProjectId !== null}
                onClick={() => setPendingDelete(null)}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                disabled={deletingProjectId !== null}
                onClick={() => void deleteProject(pendingDelete)}
              >
                {deletingProjectId === pendingDelete.id ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
                {deletingProjectId === pendingDelete.id
                  ? "Удаляем…"
                  : "Удалить навсегда"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
