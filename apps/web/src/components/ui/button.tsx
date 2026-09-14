// apps/web/src/components/ui/button.tsx
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md h-11 px-4 " +
  "text-sm font-medium transition-colors " +
  // A faded brand fill reads as "weak", not "disabled" — text and fill fade
  // together so their contrast with each OTHER never drops, but both blend
  // into the page and become hard to read. A flat neutral fill stays legible
  // at a glance instead.
  "disabled:pointer-events-none disabled:border-line-strong disabled:bg-line-strong disabled:text-dim";

const VARIANT: Record<ButtonVariant, string> = {
  // hover:opacity-90 (not a hover fill swap): accent-strong is now a
  // different hue per theme (sindoor red / marigold gold) rather than one
  // step of a single ramp, so there's no single "darker" token to swap to
  // that holds in both themes — opacity keeps the white-text contrast ratio
  // comfortably above AA in both (verified: 6.06 light, 5.35 dark).
  primary: "bg-accent-strong text-white hover:opacity-90",
  secondary: "bg-surface border border-line-strong text-ink hover:bg-cream",
  ghost: "bg-transparent text-accent-ink hover:bg-accent-wash",
  danger: "bg-danger text-white hover:opacity-90",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  opts: { className?: string } = {},
): string {
  return [BASE, VARIANT[variant], opts.className].filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...rest }, ref) => (
    <button ref={ref} className={buttonClasses(variant, { className })} {...rest} />
  ),
);
Button.displayName = "Button";
