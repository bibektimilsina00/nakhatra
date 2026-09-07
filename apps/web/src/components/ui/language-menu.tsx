"use client";

import { useCallback, useRef, useState } from "react";

import { useDismissable } from "@/components/ui/use-dismissable";
import { type Language, useTranslation } from "@/lib/i18n/language-context";

/** The three languages, and how each names itself. */
export const LANGUAGES: { code: Language; label: string; nativeName: string }[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "ne", label: "Nepali", nativeName: "नेपाली" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
];

/**
 * The language picker, everywhere.
 *
 * This is the marketing header's control, lifted out of it so the app wears the
 * same one. The trigger shows the fixed-width code rather than the native name:
 * "नेपाली" is twice the width of "EN" and would shove whatever sits beside it
 * around on every change — which in the app bar is the notification bell.
 *
 * It carries its own open state instead of riding the marketing header's
 * `.navmenu` machinery, because that machinery only exists inside that header.
 * Same markup, same panel, works anywhere.
 */
export function LanguageMenu({
  className = "",
  dropUp = false,
}: {
  className?: string;
  /** The footer sits at the bottom of the page; its panel has to go upward. */
  dropUp?: boolean;
}) {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useDismissable(open, box, useCallback(() => setOpen(false), []));

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={LANGUAGES.find((l) => l.code === language)?.label ?? "Language"}
        className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-2 text-muted transition-colors hover:text-paper"
      >
        <svg
          className="size-[15px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3.3 9h17.4M3.3 15h17.4" />
        </svg>
        <span className="font-mono text-[11.5px] uppercase tracking-[0.1em]">{language}</span>
        <svg
          className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M3 4.5 6 7.5l3-3" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 ${dropUp ? "bottom-full pb-3" : "top-full pt-3"}`}
        >
          <div className="w-[168px] rounded-[8px] border border-white/12 bg-[#0B0E18]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                aria-pressed={l.code === language}
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-[6px] px-2.5 py-2 text-left text-[13.5px] transition-colors ${
                  l.code === language
                    ? "bg-white/[0.05] text-gold"
                    : "text-muted hover:bg-white/[0.04] hover:text-paper"
                }`}
              >
                <span>{l.nativeName}</span>
                {l.code === language && (
                  <svg
                    className="size-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8.5 6.5 12 13 4.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
