import type { PeriodRasifal, Rasifal } from "@/features/rasifal/types";

/** The day's sky. Public: no birth data, no token. */
export async function fetchRasifal(on?: string): Promise<Rasifal> {
  const qs = on ? `?on=${encodeURIComponent(on)}` : "";
  const res = await fetch(`/api/v1/rasifal${qs}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`rasifal ${res.status}`);
  return (await res.json()) as Rasifal;
}

/** A week or a month, aggregated from every day in the span. */
export async function fetchRasifalPeriod(
  span: "weekly" | "monthly",
  on?: string,
): Promise<PeriodRasifal> {
  const qs = new URLSearchParams({ span, ...(on ? { on } : {}) });
  const res = await fetch(`/api/v1/rasifal/period?${qs}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`rasifal period ${res.status}`);
  return (await res.json()) as PeriodRasifal;
}
