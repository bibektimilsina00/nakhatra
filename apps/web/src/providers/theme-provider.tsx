"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

export type Theme = "light" | "dark";

const STORAGE_KEY = "nakhatra-theme";
const OVERRIDE_KEY = "nakhatra-theme-user-override";

/**
 * Route-aware theme provider.
 * Marketing routes default to dark mode ("Night Sky"), while application/kundali/patro
 * routes default to light mode ("Temple Ember / Janma Patrika").
 * If the user explicitly toggled their theme preference, their preference is honored across pages.
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const serverSnapshot = (): Theme => "light";

export function getRouteDefaultTheme(pathname: string): Theme {
  if (pathname === "/" || pathname.startsWith("/landing") || pathname.startsWith("/marketing")) {
    return "dark";
  }
  return "light";
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const toggle = useCallback(() => {
    const current = snapshot();
    const next: Theme = current === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(OVERRIDE_KEY, "true");
    } catch {
      // private mode safeguard
    }
    listeners.forEach((cb) => cb());
  }, []);

  return { theme, toggle };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const hasUserOverride = localStorage.getItem(OVERRIDE_KEY) === "true";
      const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;

      if (hasUserOverride && (storedTheme === "light" || storedTheme === "dark")) {
        document.documentElement.dataset.theme = storedTheme;
      } else {
        const routeDefault = getRouteDefaultTheme(pathname);
        document.documentElement.dataset.theme = routeDefault;
      }
      listeners.forEach((cb) => cb());
    } catch {
      // fallback to light
    }
  }, [pathname]);

  return <>{children}</>;
}

/** Runs before paint to set initial route theme or restored user preference. */
export const THEME_INIT_SCRIPT = `(function(){
  try {
    var hasOverride = localStorage.getItem("${OVERRIDE_KEY}") === "true";
    var stored = localStorage.getItem("${STORAGE_KEY}");
    if (hasOverride && (stored === "dark" || stored === "light")) {
      document.documentElement.dataset.theme = stored;
    } else {
      var path = window.location.pathname;
      var defaultTheme = (path === "/" || path.indexOf("/landing") === 0 || path.indexOf("/marketing") === 0) ? "dark" : "light";
      document.documentElement.dataset.theme = defaultTheme;
    }
  } catch(e) {
    document.documentElement.dataset.theme = "light";
  }
})();`;
