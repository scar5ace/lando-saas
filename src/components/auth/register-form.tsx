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
import { registrationErrorMessage } from "./auth-errors";
import { authHref, safeNextPath, verificationCallbackPath } from "./safe-next";
import { VerificationNotice } from "./verification-notice";

type RegisterFormProps = {
  next: string;
};

export function RegisterForm({ next }: RegisterFormProps) {
  const router = useRouter();
  const safeNext = safeNextPath(next);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (sentTo) return <VerificationNotice email={sentTo} next={safeNext} />;

  return (
    <form
      className="space-y-5"
      aria-busy={isSubmitting}
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);

        if (name.trim().length < 2) {
          setError("Укажите имя — минимум 2 символа.");
          return;
        }

        if (password.length < 10) {
          setError("Пароль должен содержать не менее 10 символов.");
          return;
        }

        if (password !== passwordConfirmation) {
          setError("Пароли не совпадают.");
          return;
        }

        setIsSubmitting(true);
        const normalizedEmail = email.trim().toLowerCase();

        try {
          const result = await authClient.signUp.email({
            name: name.trim(),
            email: normalizedEmail,
            password,
            callbackURL: verificationCallbackPath(safeNext),
          });

          if (result.error) {
            setError(registrationErrorMessage(result.error));
            return;
          }

          if (result.data?.user.emailVerified) {
            router.replace(safeNext);
            router.refresh();
            return;
          }

          setSentTo(normalizedEmail);
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
        <Label htmlFor="register-name">Имя</Label>
        <Input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Как к вам обращаться"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          maxLength={80}
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(error) && name.trim().length < 2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.ru"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Пароль</Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Не менее 10 символов"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={10}
          maxLength={128}
          required
          disabled={isSubmitting}
          aria-describedby="register-password-hint"
        />
        <p
          id="register-password-hint"
          className="text-xs leading-5 text-[var(--text-tertiary)]"
        >
          Используйте уникальный пароль длиной от 10 до 128 символов.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password-confirmation">Повторите пароль</Label>
        <Input
          id="register-password-confirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          placeholder="Введите пароль ещё раз"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          minLength={10}
          maxLength={128}
          required
          disabled={isSubmitting}
          aria-invalid={
            Boolean(passwordConfirmation) && password !== passwordConfirmation
          }
        />
      </div>

      {error && <AuthFeedback id="register-error">{error}</AuthFeedback>}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {isSubmitting ? "Создаём аккаунт…" : "Создать аккаунт"}
        {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>

      <p className="text-center text-xs leading-5 text-[var(--text-tertiary)]">
        Регистрируясь, вы соглашаетесь использовать сервис добросовестно и не
        размещать запрещённый контент.
      </p>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Уже есть аккаунт?{" "}
        <Link
          href={authHref("/login", safeNext)}
          className="rounded font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"
        >
          Войти
        </Link>
      </p>
    </form>
  );
}
