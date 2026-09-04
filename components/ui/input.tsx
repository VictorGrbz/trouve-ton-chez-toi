import { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`min-h-11 w-full rounded-card border border-border bg-surface px-4 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${className}`}
      {...props}
    />
  );
}
