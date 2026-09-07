"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useOpenKundali } from "@/features/dashboard/hooks/use-open-kundali";
import { ChartLattice, chartArt } from "@/features/kundali/chart-art";
import { CreateKundaliDialog } from "@/features/kundali/components/create-kundali-dialog";
import { ReadingSkeleton } from "@/features/report/components/reading-status";
import { useSavedKundalis } from "@/features/vault/hooks/use-vault";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * The reading page before it has a chart to read.
 *
 * Deliberately the reading page's own layout — same bar, same two columns,
 * same card frames — with the chart column replaced by the list of charts to
 * choose from. Arriving from the sidebar means nothing has been picked, and
 * the pages take their chart from `sessionStorage`, so without this you were
 * shown whichever chart you happened to open last as though you had asked for
 * it.
 */
export function ChooseKundali({ mode }: { mode: "reading" | "live" }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: kundalis = [], isPending } = useSavedKundalis();
  const [creating, setCreating] = useState(false);

  const destination = mode === "live" ? "/reading/live" : "/reading";
  // The callback form, so the navigation goes where *this* page was asked for
  // rather than to the hook's default. Opening stashes the chart first, which
  // is what the destination reads.
  const { open, openingId, failedId } = useOpenKundali(() => router.push(destination));

  return (
    <AppShell
      sidebar={false}
      bar={
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            aria-label={t.readingBack}
            className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-white/10 text-muted transition-colors hover:border-white/25 hover:text-paper"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-bold text-paper">
              {t.chooseTitle}
            </span>
            <span className="block truncate text-[11px] text-faint">
              {mode === "live" ? t.chooseLiveNote : t.chooseReadingNote}
            </span>
          </span>
        </div>
      }
    >
      <main className="mx-auto w-full max-w-[1600px] px-6 py-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[460px_minmax(0,1fr)] lg:items-start xl:grid-cols-[500px_minmax(0,1fr)]">
          {/* Where the charts go once one is chosen. */}
          <aside className="space-y-6 lg:sticky lg:top-20">
            <div className="space-y-4 rounded-[8px] border border-white/10 bg-[#161B2B] p-4">
              <div className="border-b border-white/10 pb-2.5">
                <h2 className="text-[15px] font-bold text-paper">
                  {mode === "live" ? t.dashNavLive : t.dashNavReading}
                </h2>
                <p className="mt-0.5 text-[11.5px] text-faint">
                  {mode === "live" ? t.chooseLiveNote : t.chooseReadingNote}
                </p>
              </div>

              {isPending ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((row) => (
                    <div
                      key={row}
                      className="h-[68px] animate-pulse rounded-[8px] border border-white/[0.07] bg-white/[0.03]"
                    />
                  ))}
                </div>
              ) : (
                <div className="max-h-[calc(100vh-320px)] space-y-2 overflow-y-auto pr-1">
                  {kundalis.map((kundali) => {
                    const { fill, stroke } = chartArt(kundali.id);
                    return (
                      <button
                        key={kundali.id}
                        type="button"
                        // A row saved before `tz_name` was stored cannot be
                        // recalculated without guessing a historical offset,
                        // which is the one thing rule 5 forbids.
                        disabled={!kundali.birth || openingId === kundali.id}
                        onClick={() => open(kundali)}
                        className="flex w-full items-center gap-3 rounded-[8px] border border-white/10 bg-[#0F1320] p-2.5 text-left transition-colors hover:border-gold/45 disabled:pointer-events-none disabled:opacity-45"
                      >
                        <span
                          className="grid size-12 shrink-0 place-items-center rounded-[6px]"
                          style={{ background: fill }}
                        >
                          <ChartLattice stroke={stroke} className="size-8" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-paper">
                            {kundali.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">
                            {kundali.dob} · {kundali.tob}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-faint">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{kundali.place_name}</span>
                          </span>
                        </span>
                        {openingId === kundali.id && (
                          <span className="shrink-0 text-[11px] text-gold2">{t.dashOpening}</span>
                        )}
                        {failedId === kundali.id && (
                          <span className="shrink-0 text-[11px] text-rose-300">
                            {t.dashLoadFailed}
                          </span>
                        )}
                        {!kundali.birth && (
                          <span className="max-w-[120px] shrink-0 text-right text-[10.5px] leading-tight text-faint">
                            {t.dashNotRecalculable}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {kundalis.length === 0 && (
                    <p className="py-3 text-[12.5px] text-faint">{t.chooseEmpty}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-white/[0.16] p-3 text-[12.5px] text-muted transition-colors hover:border-gold/45 hover:text-paper"
                  >
                    <Plus className="size-4 text-gold" />
                    {t.dashNewKundali}
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* The reading itself, waiting on a chart. The frames are the ones it
              will fill, so choosing does not rearrange the page under you. */}
          <section aria-hidden>
            <ReadingSkeleton count={3} />
          </section>
        </div>
      </main>

      <CreateKundaliDialog open={creating} onClose={() => setCreating(false)} />
    </AppShell>
  );
}
