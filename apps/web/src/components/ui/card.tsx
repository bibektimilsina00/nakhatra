// apps/web/src/components/ui/card.tsx
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

export function cardClasses(
  opts: { tinted?: boolean; className?: string } = {},
): string {
  const base = "rounded-lg border p-4";
  const fill = opts.tinted
    ? "bg-accent-tint text-ink border-line-strong"
    : "bg-surface text-ink border-line-strong";
  return [base, fill, opts.className].filter(Boolean).join(" ");
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tinted?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ tinted, className, ...rest }, ref) => (
    <div ref={ref} className={cardClasses({ tinted, className })} {...rest} />
  ),
);
Card.displayName = "Card";
