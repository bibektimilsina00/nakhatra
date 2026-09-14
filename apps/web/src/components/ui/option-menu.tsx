"use client";

import { useCallback, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { useDismissable } from "@/components/ui/use-dismissable";

/**
 * A small "pick one of these" dropdown, in the app's own clothes.
 *
 * Replaces the native `<select>` the audio bar used, which took the operating
 * system's styling and ignored the theme entirely — a light-grey Aqua menu in
 * the middle of a dark reading.
 */
export function OptionMenu<T extends string>({
  value,
  options,
  onChange,
  label,
  align = "right",
  className = "",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** Screen-reader name; the trigger itself only shows the current value. */
  label: string;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismissable(open, box, useCallback(() => setOpen(false), []));

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className="flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs text-accent-ink transition-colors hover:border-accent-strong"
      >
        <span className="tabular-nums">{current.label}</span>
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute z-50 mt-2 min-w-[92px] rounded-lg border border-line-strong bg-surface p-1.5 shadow-raised ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                  option.value === value
                    ? "bg-accent-wash text-accent-ink"
                    : "text-muted hover:bg-cream hover:text-ink"
                }`}
              >
                <span className="tabular-nums">{option.label}</span>
                {option.value === value && <Check className="size-3.5 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
