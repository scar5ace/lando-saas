"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

import { AuthFeedback } from "./auth-feedback";
import { isEmailVerificationError, loginErrorMessage } from "./auth-errors";
import { authHref, safeNextPath } from "./safe-next";
import { VerificationNotice } from "./verification-notice";

type LoginFormProps = {
  next: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const safeNext = safeNextPath(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (needsVerification) {
    return (
      <VerificationNotice
        email={email.trim().toLowerCase()}
        next={safeNext}
        onBack={() => {
          setNeedsVerification(false);
          setError(null);
        }}
      />
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
          const result = await authClient.signIn.email({
            email: email.trim().toLowerCase(),
            password,
            rememberMe: true,
          });

          if (result.error) {
            setError(loginErrorMessage(result.error));
            if (isEmailVerificationError(result.error))
              setNeedsVerification(true);
            return;
          }

          router.replace(safeNext);
          router.refresh();
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
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
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
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="login-password">Пароль</Label>
          <Link
            href={authHref("/forgot-password", safeNext)}
            className="rounded text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"
          >
            Забыли пароль?
          </Link>
        </div>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Введите пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
        />
      </div>

      {error && <AuthFeedback id="login-error">{error}</AuthFeedback>}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {isSubmitting ? "Входим…" : "Войти"}
        {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Нет аккаунта?{" "}
        <Link
          href={authHref("/register", safeNext)}
          className="rounded font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"
        >
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
