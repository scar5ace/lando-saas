import Link from "next/link";

import { productConfig } from "@/config/product";
import { cn } from "@/lib/utils";

type ProductMarkProps = {
  className?: string;
  href?: string;
};

export function ProductMark({ className, href = "/" }: ProductMarkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-medium)] font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
      aria-label={`${productConfig.name} — на главную`}
    >
      <span
        className="grid size-8 place-items-center rounded-[9px] bg-[var(--primary)] text-sm font-bold text-white shadow-sm"
        aria-hidden="true"
      >
        {productConfig.name.charAt(0).toLocaleUpperCase("ru")}
      </span>
      <span className="text-lg text-[var(--text-primary)]">
        {productConfig.name}
      </span>
    </Link>
  );
}
