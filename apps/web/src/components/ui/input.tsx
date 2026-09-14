// apps/web/src/components/ui/input.tsx
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export function inputClasses(
  opts: { invalid?: boolean; className?: string } = {},
): string {
  const base =
    "h-11 w-full rounded-md border bg-surface px-3 text-base text-ink " +
    "placeholder:text-dim focus-visible:outline-none focus-visible:border-ring";
  const border = opts.invalid ? "border-danger" : "border-line-strong";
  return [base, border, opts.className].filter(Boolean).join(" ");
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className, ...rest }, ref) => (
    <input ref={ref} className={inputClasses({ invalid, className })} {...rest} />
  ),
);
Input.displayName = "Input";

/** Sits directly below the field it belongs to — design.md §5 Inputs: never collected at the top. */
export function FieldError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-danger">{children}</p>;
}
