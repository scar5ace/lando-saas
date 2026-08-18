"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

import { AuthFeedback } from "./auth-feedback";
import { isAuthServiceError, isRateLimitError } from "./auth-errors";
import { authHref, safeNextPath } from "./safe-next";

type ForgotPasswordFormProps = {
  next: string;
};

export function ForgotPasswordForm({ next }: ForgotPasswordFormProps) {
  const safeNext = safeNextPath(next);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSent) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--success-surface)] text-[var(--success)]">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Проверьте почту
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Если аккаунт с таким email существует, мы отправили ссылку для
            создания нового пароля.
          </p>
        </div>
        <AuthFeedback tone="info" className="text-left">
          Ссылка действует ограниченное время и может быть использована один
          раз. При локальном запуске письмо не отправляется: ссылка появляется в
          журнале сервера.
        </AuthFeedback>
        <Link
          href={authHref("/login", safeNext)}
          className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Вернуться ко входу
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      aria-busy={isSubmitting}
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
          const redirectParams = new URLSearchParams({ next: safeNext });
          const result = await authClient.requestPasswordReset({
            email: email.trim().toLowerCase(),
            redirectTo: `/reset-password?${redirectParams.toString()}`,
          });

          if (result.error && isRateLimitError(result.error)) {
            setError(
              "Запрос уже отправлялся недавно. Подождите немного и попробуйте снова.",
            );
            return;
          }

          if (result.error && isAuthServiceError(result.error)) {
            setError(
              "Сервис восстановления временно недоступен. Попробуйте ещё раз позднее.",
            );
            return;
          }

          setIsSent(true);
        } catch {
          setError(
            "Не удалось связаться с сервером. Проверьте соединение и попробуйте снова.",
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.ru"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
        />
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">
          Мы не сообщаем, зарегистрирован ли этот адрес.
        </p>
      </div>

      {error && <AuthFeedback>{error}</AuthFeedback>}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        )}
        {isSubmitting ? "Отправляем…" : "Получить ссылку"}
      </Button>

      <p className="text-center">
        <Link
          href={authHref("/login", safeNext)}
          className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Вернуться ко входу
        </Link>
      </p>
    </form>
  );
}
