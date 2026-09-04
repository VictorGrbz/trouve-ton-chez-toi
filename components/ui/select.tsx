import { type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...props }: SelectProps) {
  return (
    <select
      className={`min-h-11 w-full rounded-card border border-border bg-surface px-4 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${className}`}
      {...props}
    />
  );
}
