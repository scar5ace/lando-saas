import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-30 w-full resize-y rounded-[14px] border border-[var(--border-default)] bg-white px-4 py-3 text-base text-[var(--text-primary)] transition outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
