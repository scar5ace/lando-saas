import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { safeNextPath } from "@/components/auth/safe-next";
import { productConfig } from "@/config/product";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  description: `Получите безопасную одноразовую ссылку для смены пароля ${productConfig.name}.`,
  robots: { index: false, follow: false },
};

type ForgotPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <AuthShell
      title="Восстановите доступ"
      description="Укажите email — мы отправим одноразовую ссылку для создания нового пароля."
    >
      <ForgotPasswordForm next={next} />
    </AuthShell>
  );
}
