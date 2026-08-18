import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { safeNextPath } from "@/components/auth/safe-next";
import { productConfig } from "@/config/product";

export const metadata: Metadata = {
  title: "Новый пароль",
  description: `Создайте новый пароль для аккаунта ${productConfig.name}.`,
  robots: { index: false, follow: false },
};

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const token = first(params.token);
  const linkError = first(params.error);

  return (
    <AuthShell
      title="Создайте новый пароль"
      description="Задайте уникальный пароль, который не используете в других сервисах."
    >
      <ResetPasswordForm token={token} next={next} linkError={linkError} />
    </AuthShell>
  );
}
