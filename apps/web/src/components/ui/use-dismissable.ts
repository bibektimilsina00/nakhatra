"use client";

import { useEffect, type RefObject } from "react";

/**
 * Close on a click outside, or on Escape.
 *
 * Five components had written this out: the language menu, the chart switcher,
 * the milan picker, the voice selector and the app bar. Four of them listened
 * for the outside click and forgot Escape, and every one of them attached its
 * listener on mount rather than while open — so a page with five closed menus
 * kept five document listeners alive for nothing.
 */
export function useDismissable(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    // Bound to `open`, so a closed menu costs nothing.
    if (!open) return;

    const outside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    // `mousedown`, not `click`: a menu that closes on mouseup swallows the
    // press that was meant to activate whatever is underneath it.
    addEventListener("mousedown", outside);
    addEventListener("keydown", escape);
    return () => {
      removeEventListener("mousedown", outside);
      removeEventListener("keydown", escape);
    };
  }, [open, ref, close]);
}
