"use client";

import { useCallback, useSyncExternalStore } from "react";
import { TriangleAlert } from "lucide-react";

import {
  affordableSeconds,
  chargeMinor,
  formatDuration,
  formatMinor,
} from "@/features/consultations/money";
import type { Consultation, Wallet } from "@/features/consultations/types";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useTranslation } from "@/lib/i18n/language-context";

/** Warn while there is still time to do something about it. */
const WARN_SECONDS = 120;

/**
 * The running cost, while it runs.
 *
 * Ticks off the wall clock through `useSyncExternalStore` rather than reading
 * `Date.now()` in render — the clock is external state, and two renders in one
 * commit could otherwise disagree about the time.
 *
 * The elapsed time is measured from the server's `connected_at`, so a client
 * with a skewed clock shows a slightly wrong number but is never billed by it.
 */
export function SessionMeter({
  consultation,
  wallet,
}: {
  consultation: Consultation;
  wallet: Wallet | undefined;
}) {
  const { t } = useTranslation();
  const now = useTick();

  const running = consultation.state === "active" && Boolean(consultation.connected_at);
  const elapsed = running
    ? Math.max(0, (now - Date.parse(consultation.connected_at as string)) / 1000)
    : consultation.billed_seconds;

  // After a session, the authoritative figure is what was captured — not what
  // this component would compute.
  const cost =
    consultation.state === "ended"
      ? consultation.charged_minor
      : chargeMinor(elapsed, consultation.rate_per_minute_minor);

  const remaining = wallet
    ? affordableSeconds(wallet.available_minor, consultation.rate_per_minute_minor)
    : 0;
  const low = running && wallet !== undefined && remaining <= WARN_SECONDS;

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-2xs uppercase tracking-[0.14em] text-dim">
          {formatMinor(consultation.rate_per_minute_minor, consultation.currency)}
          {" / "}
          {t.consultPerMinute}
        </span>
        <Pill tone={running ? "success" : "neutral"}>
          {running && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
          {consultation.state}
        </Pill>
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <span>
          <span className="block text-xs text-dim">{t.consultElapsed}</span>
          <span className="block text-2xl font-bold leading-none tabular-nums text-ink">
            {formatDuration(elapsed)}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-xs text-dim">{t.consultCost}</span>
          <span className="block text-2xl font-bold leading-none tabular-nums text-accent-ink">
            {formatMinor(cost, consultation.currency)}
          </span>
        </span>
      </div>

      {wallet && (
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-2.5 text-xs">
          <span className="text-dim">{t.consultBalance}</span>
          <span className="tabular-nums text-muted">
            {formatMinor(wallet.available_minor, wallet.currency)}
            {running && ` · ${formatDuration(remaining)} ${t.consultLeft}`}
          </span>
        </div>
      )}

      {low && (
        // Said at two minutes, not at zero. A warning that arrives as the call
        // ends is not a warning.
        <p className="mt-3 flex items-start gap-2 rounded-md border border-accent/30 bg-accent-wash px-3 py-2 text-xs leading-[1.6] text-accent-ink">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {t.consultLowBalance}
        </p>
      )}
    </Card>
  );
}

/** The wall clock, once a second, as external state. */
function useTick(): number {
  const subscribe = useCallback((onChange: () => void) => {
    const id = setInterval(onChange, 1000);
    return () => clearInterval(id);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => 0,
  );
}
