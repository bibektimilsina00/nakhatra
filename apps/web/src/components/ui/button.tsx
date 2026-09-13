// apps/web/src/components/ui/button.tsx
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md h-11 px-4 " +
  "text-sm font-medium transition-colors " +
  "disabled:pointer-events-none disabled:opacity-40";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent-strong text-white hover:bg-accent-ink",
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
