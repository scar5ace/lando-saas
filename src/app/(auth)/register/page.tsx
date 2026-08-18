import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { safeNextPath } from "@/components/auth/safe-next";
import { productConfig } from "@/config/product";

export const metadata: Metadata = {
  title: "Регистрация",
  description: `Создайте аккаунт ${productConfig.name} и получите первую версию своего лендинга.`,
  robots: { index: false, follow: false },
};

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "/dashboard/new");

  return (
    <AuthShell
      title="Создайте аккаунт"
      description="Зарегистрируйтесь, чтобы сохранить запрос и создать первый сайт."
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
