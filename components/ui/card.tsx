import { type HTMLAttributes } from "react";

type CardVariant = "standard" | "accent";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  standard: "bg-surface",
  accent: "bg-surface-accent",
};

export function Card({
  variant = "standard",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-card border border-border p-4 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
