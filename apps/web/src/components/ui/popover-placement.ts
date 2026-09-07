/**
 * Where a popover opens, and how tall it may be.
 *
 * Decided when the popover is opened, from the anchor's position and the space
 * around it — not from an effect that measures after painting, which would show
 * the panel in the wrong place for a frame and then move it.
 *
 * Flipping alone is not enough: in a short window neither side has room, and a
 * panel that flips up but is still too tall is clipped at the top instead of
 * the bottom. So this also returns the height available on the side it picked,
 * and the caller caps the panel to it. Scrolling inside a panel that fits is
 * strictly better than a panel that runs off the screen.
 */
export type Placement = "down" | "up";

export interface Fit {
  placement: Placement;
  /** Cap for the panel, in pixels. Apply with `overflow-y: auto`. */
  maxHeight: number;
}

/** Breathing room between the panel and the edge of the viewport. */
const MARGIN = 12;

/** Below this a panel is unusable, so it is worth scrolling the page instead. */
const MIN_USABLE = 180;

export function popoverFit(anchor: HTMLElement | null, preferred: number): Fit {
  if (!anchor || typeof window === "undefined") {
    return { placement: "down", maxHeight: preferred };
  }

  const rect = anchor.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - MARGIN;
  const above = rect.top - MARGIN;

  // Down by default — a menu that opens where you expect beats one that is
  // marginally better placed.
  if (below >= preferred) return { placement: "down", maxHeight: preferred };
  if (above >= preferred) return { placement: "up", maxHeight: preferred };

  // Neither side fits: take the roomier one and let the panel scroll.
  return above > below
    ? { placement: "up", maxHeight: Math.max(above, MIN_USABLE) }
    : { placement: "down", maxHeight: Math.max(below, MIN_USABLE) };
}

/** The positioning classes for a placement. */
export function placementClass(placement: Placement): string {
  return placement === "up" ? "bottom-full mb-2" : "top-full mt-2";
}
