import type { SavedKundali } from "@/features/vault/types";
import type { MilanAnalysis, MilanResponse } from "@/features/milan/types";

/**
 * The match, kept for the length of the tab.
 *
 * Everything on the milan page lived in component state and a mutation, so
 * opening a birth sky and pressing back threw away both selections and a
 * finished match — the visitor had to pick two charts and pay for the reading
 * again to see what they had just been looking at. sessionStorage rather than
 * local: a match belongs to the sitting, not to the browser forever.
 */
const KEY = "nakhatra_milan_session";

export type MilanSession = {
  bride: SavedKundali | null;
  groom: SavedKundali | null;
  result: MilanResponse | null;
  analysis: MilanAnalysis | null;
};

export function saveMilanSession(session: MilanSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // private mode or a full store — the page still works, it just forgets
  }
}

export function loadMilanSession(): MilanSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MilanSession) : null;
  } catch {
    return null;
  }
}

export function clearMilanSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
