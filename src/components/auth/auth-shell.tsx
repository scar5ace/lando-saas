import { LockKeyhole } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { productConfig } from "@/config/product";

import { ProductMark } from "../marketing/product-mark";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="mb-7 flex justify-center">
        <ProductMark />
      </div>

      <Card className="border-[var(--border-strong)] shadow-[0_24px_70px_-38px_rgba(15,23,42,0.4)]">
        <CardHeader className="space-y-3 p-6 pb-0 sm:p-8 sm:pb-0">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h1>
          <CardDescription className="text-base leading-6">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">{children}</CardContent>
      </Card>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-[var(--text-tertiary)]">
        <LockKeyhole className="size-3.5" aria-hidden="true" />
        Безопасная авторизация и серверная сессия {productConfig.name}
      </p>
    </div>
  );
}
