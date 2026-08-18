import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthFeedbackProps = {
  children: React.ReactNode;
  id?: string;
  tone?: "error" | "success" | "info";
  className?: string;
};

const styles = {
  error: "border-red-200 bg-[var(--danger-surface)] text-red-800",
  success: "border-green-200 bg-[var(--success-surface)] text-green-800",
  info: "border-blue-200 bg-[var(--primary-subtle)] text-blue-800",
} as const;

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
} as const;

export function AuthFeedback({
  children,
  id,
  tone = "error",
  className,
}: AuthFeedbackProps) {
  const Icon = icons[tone];

  return (
    <div
      id={id}
      className={cn(
        "flex items-start gap-2.5 rounded-[var(--radius-medium)] border p-3 text-sm leading-5",
        styles[tone],
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
