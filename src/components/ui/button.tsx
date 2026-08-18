import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] text-sm font-semibold outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]",
        secondary:
          "bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-slate-200",
        outline:
          "border border-[var(--border-default)] bg-white text-[var(--text-primary)] hover:bg-slate-50",
        ghost:
          "text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)]",
        danger: "bg-[var(--danger)] text-white hover:bg-red-700",
        ai: "bg-[var(--ai-accent)] text-white hover:bg-[var(--ai-accent-hover)]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
