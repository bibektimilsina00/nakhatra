import type { BirthDetailsIn, Chart } from "@/features/kundali/types";
import type { MilanResponse } from "@/features/milan/types";

/**
 * A match handed to the consultation.
 *
 * The voice workspace opens against one chart. When the visitor arrives from a
 * milan result, this carries the second chart and the finished score alongside
 * it, so the astrologer can answer about the pair. Cleared when they leave, so
 * a later single-chart session is not haunted by someone's marriage match.
 */
const KEY = "nakhatra_milan_live";

export type MilanLive = {
  /** Whose chart the session is primarily about. */
  self: { name: string; birth: BirthDetailsIn; chart: Chart };
  partner: { name: string; chart: Chart };
  match: {
    total_guna: number;
    max_guna: number;
    verdict: string;
    kutas: { name: string; obtained: number; max_points: number }[];
    manglik_note: string;
  };
};

export function saveMilanLive(live: MilanLive): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(live));
  } catch {
    // private mode — the consultation simply opens on the single chart
  }
}

export function loadMilanLive(): MilanLive | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MilanLive) : null;
  } catch {
    return null;
  }
}

export function clearMilanLive(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

/** The shape the API's optional `milan` field expects. */
export function toMilanContext(live: MilanLive) {
  return {
    partner_name: live.partner.name,
    partner_chart: live.partner.chart,
    total_guna: live.match.total_guna,
    max_guna: live.match.max_guna,
    verdict: live.match.verdict,
    kutas: live.match.kutas,
    manglik_note: live.match.manglik_note,
  };
}

/** Build the payload from a finished match. The bride's chart leads, since
 *  the consultation has to be anchored on one; the partner's rides along. */
export function milanLiveFrom(
  result: MilanResponse,
  brideBirth: BirthDetailsIn,
): MilanLive | null {
  if (!result.bride_chart || !result.groom_chart) return null;
  return {
    self: { name: result.bride_name, birth: brideBirth, chart: result.bride_chart },
    partner: { name: result.groom_name, chart: result.groom_chart },
    match: {
      total_guna: result.total_guna,
      max_guna: result.max_guna,
      verdict: result.verdict || "",
      kutas: result.kutas.map((k) => ({
        name: k.name,
        obtained: k.obtained,
        max_points: k.max_points,
      })),
      manglik_note: result.manglik_compatibility.reason || "",
    },
  };
}
