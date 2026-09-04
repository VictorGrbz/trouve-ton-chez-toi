import { type HTMLAttributes } from "react";

type BadgeVariant = "neutral" | "status" | "warn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-foreground",
  status: "bg-accent-bg text-primary",
  warn: "bg-warn-bg text-warn-foreground",
};

export function Badge({
  variant = "neutral",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
