// apps/web/src/components/ui/button.tsx
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md h-11 px-4 " +
  "text-sm font-medium transition-colors " +
  "disabled:pointer-events-none disabled:opacity-40";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent-strong text-white hover:opacity-90",
  secondary: "bg-surface border border-line-strong text-ink hover:bg-cream",
  ghost: "bg-transparent text-accent-strong hover:bg-accent-wash",
  danger: "bg-danger text-white hover:opacity-90",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  opts: { size?: "sm" | "md"; className?: string } = {},
): string {
  const size = opts.size === "sm" ? "h-9 px-3 text-sm" : "";
  return [BASE, VARIANT[variant], size, opts.className].filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size, className, ...rest }, ref) => (
    <button ref={ref} className={buttonClasses(variant, { size, className })} {...rest} />
  ),
);
Button.displayName = "Button";
