"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderCircle, MailCheck, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

import { AuthFeedback } from "./auth-feedback";
import { isAuthServiceError, isRateLimitError } from "./auth-errors";
import { authHref, verificationCallbackPath } from "./safe-next";

type VerificationNoticeProps = {
  email: string;
  next: string;
  onBack?: () => void;
};

export function VerificationNotice({
  email,
  next,
  onBack,
}: VerificationNoticeProps) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setIsSending(true);
    setMessage(null);
    setError(null);

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: verificationCallbackPath(next),
      });

      if (result.error && isRateLimitError(result.error)) {
        setError(
          "Письмо уже отправлялось недавно. Подождите немного и попробуйте снова.",
        );
      } else if (result.error && isAuthServiceError(result.error)) {
        setError(
          "Сервис отправки писем временно недоступен. Попробуйте ещё раз позднее.",
        );
      } else {
        setMessage(
          "Если аккаунт зарегистрирован, новое письмо уже отправлено.",
        );
      }
    } catch {
      setError(
        "Не удалось связаться с сервером. Проверьте соединение и попробуйте снова.",
      );
    } finally {
      setIsSending(false);
    }
  }

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
          Мы отправили ссылку подтверждения на{" "}
          <span className="font-medium text-[var(--text-primary)]">
            {email}
          </span>
          . Откройте её, чтобы активировать аккаунт.
        </p>
      </div>

      {message && <AuthFeedback tone="success">{message}</AuthFeedback>}
      {error && <AuthFeedback>{error}</AuthFeedback>}

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={resend}
          disabled={isSending}
        >
          {isSending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {isSending ? "Отправляем…" : "Отправить письмо ещё раз"}
        </Button>
        {onBack ? (
          <Button variant="ghost" className="w-full" onClick={onBack}>
            Вернуться ко входу
          </Button>
        ) : (
          <Link
            href={authHref("/login", next)}
            className="inline-flex rounded-md text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"
          >
            Уже подтвердили email? Войти
          </Link>
        )}
      </div>

      <p className="text-xs leading-5 text-[var(--text-tertiary)]">
        Не видите письмо? Проверьте папку «Спам». При локальном запуске ссылка
        выводится в журнале сервера.
      </p>
    </div>
  );
}
