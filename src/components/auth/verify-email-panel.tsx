"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Send,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { AuthFeedback } from "./auth-feedback";
import { isAuthServiceError, isRateLimitError } from "./auth-errors";
import { authHref, safeNextPath, verificationCallbackPath } from "./safe-next";

type VerifyEmailPanelProps = {
  state: "verified" | "error" | "pending";
  next: string;
};

export function VerifyEmailPanel({ state, next }: VerifyEmailPanelProps) {
  const safeNext = safeNextPath(next);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (state === "verified") {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--success-surface)] text-[var(--success)]">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Email подтверждён
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Аккаунт активирован. Войдите, чтобы продолжить работу с сайтами.
          </p>
        </div>
        <Link
          href={authHref("/login", safeNext)}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Войти и продолжить
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <span
          className={cn(
            "mx-auto grid size-14 place-items-center rounded-full",
            state === "error"
              ? "bg-[var(--warning-surface)] text-[var(--warning)]"
              : "bg-[var(--primary-subtle)] text-[var(--primary)]",
          )}
        >
          {state === "error" ? (
            <AlertTriangle className="size-7" aria-hidden="true" />
          ) : (
            <Mail className="size-7" aria-hidden="true" />
          )}
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">
          {state === "error"
            ? "Ссылка не сработала"
            : "Нужно письмо подтверждения?"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {state === "error"
            ? "Она могла устареть или уже быть использована. Укажите email, и мы отправим новую."
            : "Укажите email аккаунта — мы отправим новую ссылку. Ответ не раскрывает, зарегистрирован ли адрес."}
        </p>
      </div>

      <form
        className="space-y-4"
        aria-busy={isSending}
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage(null);
          setError(null);
          setIsSending(true);

          try {
            const result = await authClient.sendVerificationEmail({
              email: email.trim().toLowerCase(),
              callbackURL: verificationCallbackPath(safeNext),
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
                "Если аккаунт зарегистрирован, письмо отправлено. Проверьте также папку «Спам».",
              );
            }
          } catch {
            setError(
              "Не удалось связаться с сервером. Проверьте соединение и попробуйте снова.",
            );
          } finally {
            setIsSending(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="verification-email">Email</Label>
          <Input
            id="verification-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.ru"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isSending}
          />
        </div>

        {message && <AuthFeedback tone="success">{message}</AuthFeedback>}
        {error && <AuthFeedback>{error}</AuthFeedback>}

        <Button type="submit" size="lg" className="w-full" disabled={isSending}>
          {isSending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {isSending ? "Отправляем…" : "Отправить новую ссылку"}
        </Button>
      </form>

      <p className="text-center">
        <Link
          href={authHref("/login", safeNext)}
          className="rounded text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"
        >
          Вернуться ко входу
        </Link>
      </p>
    </div>
  );
}
