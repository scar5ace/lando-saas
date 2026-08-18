"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { AuthFeedback } from "./auth-feedback";
import { resetErrorMessage } from "./auth-errors";
import { authHref, safeNextPath } from "./safe-next";

type ResetPasswordFormProps = {
  token?: string;
  next: string;
  linkError?: string;
};

export function ResetPasswordForm({
  token,
  next,
  linkError,
}: ResetPasswordFormProps) {
  const safeNext = safeNextPath(next);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (isComplete) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--success-surface)] text-[var(--success)]">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Пароль изменён
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Теперь войдите с новым паролем.
          </p>
        </div>
        <Link
          href={authHref("/login", safeNext)}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Войти
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (!token || linkError) {
    return (
      <div className="space-y-5">
        <AuthFeedback>
          Ссылка недействительна или устарела. Запросите новую — предыдущая
          больше не понадобится.
        </AuthFeedback>
        <Link
          href={authHref("/forgot-password", safeNext)}
          className={cn(
            buttonVariants({ variant: "primary", size: "lg" }),
            "w-full",
          )}
        >
          Получить новую ссылку
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

        if (password.length < 10) {
          setError("Пароль должен содержать не менее 10 символов.");
          return;
        }

        if (password !== confirmation) {
          setError("Пароли не совпадают.");
          return;
        }

        setIsSubmitting(true);

        try {
          const result = await authClient.resetPassword({
            newPassword: password,
            token,
          });
          if (result.error) {
            setError(resetErrorMessage(result.error));
            return;
          }
          setIsComplete(true);
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
        <Label htmlFor="new-password">Новый пароль</Label>
        <Input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Не менее 10 символов"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={10}
          maxLength={128}
          required
          disabled={isSubmitting}
          aria-describedby="new-password-hint"
        />
        <p
          id="new-password-hint"
          className="text-xs leading-5 text-[var(--text-tertiary)]"
        >
          Не повторяйте пароль, который используете в других сервисах.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password-confirmation">
          Повторите новый пароль
        </Label>
        <Input
          id="new-password-confirmation"
          name="newPasswordConfirmation"
          type="password"
          autoComplete="new-password"
          placeholder="Введите пароль ещё раз"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          minLength={10}
          maxLength={128}
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(confirmation) && password !== confirmation}
        />
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
        {isSubmitting ? "Сохраняем…" : "Сохранить новый пароль"}
      </Button>
    </form>
  );
}
