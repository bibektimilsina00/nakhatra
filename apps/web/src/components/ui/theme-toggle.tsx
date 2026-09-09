"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/providers/theme-provider";

/** Day and night. Light is the patro; dark is the sky. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "अँध्यारो" : "उज्यालो"}
      className="flex size-8 items-center justify-center rounded-[8px] border border-brd bg-panel text-mut transition hover:border-acc/50 hover:text-acc"
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
