import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/components/auth/safe-next";
import { productConfig } from "@/config/product";

export const metadata: Metadata = {
  title: "Вход",
  description: `Войдите в аккаунт ${productConfig.name}, чтобы продолжить работу с сайтами.`,
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <AuthShell
      title={`Войдите в ${productConfig.name}`}
      description="Продолжите работу над сайтом с того места, где остановились."
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
