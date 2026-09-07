/**
 * Formatting money and time for display only.
 *
 * Nothing here decides what anything costs. The server measures the session and
 * captures the charge; this mirrors that arithmetic so the reader can watch it
 * happen. If the two ever disagree, the server is right — which is why the
 * final figure shown after a session comes from `charged_minor` on the
 * consultation rather than from anything computed here.
 */

/** Minor units to a readable amount: 2500 → "NPR 25.00". */
export function formatMinor(minor: number, currency = "NPR"): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${currency} ${(abs / 100).toFixed(2)}`;
}

/** Seconds to "4:12". */
export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * The same rules the server bills by: per second, 60-second minimum, rounded
 * up. Kept in step with `consultations/metering.py` deliberately — a meter that
 * counts differently from the invoice is worse than no meter.
 */
export const MINIMUM_BILLED_SECONDS = 60;

export function billedSeconds(elapsed: number): number {
  if (elapsed <= 0) return 0;
  return Math.max(MINIMUM_BILLED_SECONDS, Math.ceil(elapsed));
}

export function chargeMinor(elapsed: number, ratePerMinuteMinor: number): number {
  const seconds = billedSeconds(elapsed);
  if (seconds === 0 || ratePerMinuteMinor <= 0) return 0;
  return Math.ceil((seconds * ratePerMinuteMinor) / 60);
}

/** How many seconds this balance still buys. Drives the warning, not the bill. */
export function affordableSeconds(availableMinor: number, ratePerMinuteMinor: number): number {
  if (ratePerMinuteMinor <= 0) return 0;
  return Math.floor((availableMinor * 60) / ratePerMinuteMinor);
}
