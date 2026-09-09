"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "nakhatra-theme";

/**
 * The app's two faces: light is the janma patrika — parchment, red rules,
 * ink — and dark is the night sky every screen was originally built in.
 * Light is the default: the patro is the thing this product is.
 *
 * The source of truth is <html data-theme>, stamped before first paint by
 * the inline script below. React reads it through useSyncExternalStore —
 * the server snapshot says "light", so hydration always matches the
 * prerender and the real value takes over on the pass after.
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const serverSnapshot = (): Theme => "light";

export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const toggle = useCallback(() => {
    const next: Theme = snapshot() === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode — the choice just won't survive the tab
    }
    listeners.forEach((cb) => cb());
  }, []);
  return { theme, toggle };
}

/** Kept as a plain pass-through so the layout reads naturally; the theme
 *  itself lives on the <html> element, not in React state. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children;
}

/** Runs before paint, so the page never flashes the wrong theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");document.documentElement.dataset.theme=(t==="dark"||t==="light")?t:"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;
