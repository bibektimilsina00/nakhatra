import type { PatroRange } from "@/features/patro/types";

export async function fetchPatro(start: string, days: number): Promise<PatroRange> {
  const qs = new URLSearchParams({ start, days: String(days) });
  const res = await fetch(`/api/v1/patro?${qs}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`patro ${res.status}`);
  return (await res.json()) as PatroRange;
}
