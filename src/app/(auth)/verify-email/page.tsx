import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { safeNextPath } from "@/components/auth/safe-next";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { productConfig } from "@/config/product";

export const metadata: Metadata = {
  title: "Подтверждение email",
  description: `Подтвердите email для активации аккаунта ${productConfig.name}.`,
  robots: { index: false, follow: false },
};

type VerifyEmailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasValue(value: string | string[] | undefined, expected: string) {
  return Array.isArray(value) ? value.includes(expected) : value === expected;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const state = params.error
    ? "error"
    : hasValue(params.verified, "1")
      ? "verified"
      : "pending";

  return (
    <AuthShell
      title="Подтверждение email"
      description="Подтверждённый адрес защищает аккаунт и позволяет восстановить доступ."
    >
      <VerifyEmailPanel state={state} next={next} />
    </AuthShell>
  );
}
