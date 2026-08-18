import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  suppressHydrationWarning,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      suppressHydrationWarning={suppressHydrationWarning ?? type === "password"}
      type={type}
      className={cn(
        "h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-base text-[var(--text-primary)] transition outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
