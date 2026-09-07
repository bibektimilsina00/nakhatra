"use client";

import { useState } from "react";
import { ArrowRight, Heart } from "lucide-react";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { ChartPicker } from "@/features/milan/components/chart-picker";
import { MilanAnalysisPanel } from "@/features/milan/components/milan-analysis";
import { MilanResult } from "@/features/milan/components/milan-result";
import { useCalculateMatch } from "@/features/milan/hooks/use-calculate-match";
import { useMilanAnalysis } from "@/features/milan/hooks/use-milan-analysis";
import { CreateKundaliDialog } from "@/features/kundali/components/create-kundali-dialog";
import { useSavedKundalis } from "@/features/vault/hooks/use-vault";
import type { SavedKundali } from "@/features/vault/types";
import type { MilanAnalysisRequest } from "@/features/milan/types";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * The eight kutas and what each is worth.
 *
 * Shown before the match, not after: the empty state is the only moment a
 * visitor is deciding whether to bother, and "36 gunas" means nothing until you
 * can see that Nadi alone is eight of them. Static because the weights are
 * classical and fixed — the API returns the same maxima every time.
 */
const KUTAS: [string, number][] = [
  ["Varna", 1],
  ["Vashya", 2],
  ["Tara", 3],
  ["Yoni", 4],
  ["Graha Maitri", 5],
  ["Gana", 6],
  ["Bhakoot", 7],
  ["Nadi", 8],
];

/**
 * Kundali Milan.
 *
 * Two saved charts in, one Ashtakoota reading out. Picking from the vault
 * rather than re-typing two sets of birth details is the whole difference: the
 * charts are already there, already carry their IANA zones, and re-entering
 * them is four fields of opportunity to get one wrong.
 *
 * Wrapped in `AppShell`, so the sidebar and top bar are the dashboard's — this
 * is a page of the app, not a separate one.
 */
export function MilanPage() {
  const { t, language } = useTranslation();
  const eyebrow = useLatinTracking("uppercase tracking-[0.2em]");
  const { data: kundalis = [], isLoading } = useSavedKundalis();
  const match = useCalculateMatch();
  const analysis = useMilanAnalysis();

  const [bride, setBride] = useState<SavedKundali | null>(null);
  const [groom, setGroom] = useState<SavedKundali | null>(null);
  const [creating, setCreating] = useState(false);

  const sameChart = Boolean(bride && groom && bride.id === groom.id);
  const ready = Boolean(bride?.birth && groom?.birth) && !sameChart;

  // One payload for both calls. The analysis endpoint takes birth details, not
  // the finished match, so the server recomputes the Ashtakoota and the model
  // can only read a score the engine produced (CLAUDE.md rule 1).
  const payload = (): MilanAnalysisRequest | null =>
    bride?.birth && groom?.birth
      ? {
          bride: bride.birth,
          groom: groom.birth,
          bride_name: bride.name,
          groom_name: groom.name,
          language,
        }
      : null;

  const run = () => {
    const body = payload();
    if (!body) return;
    // Chained rather than run in parallel: the reading is only worth paying for
    // once the match itself has come back clean.
    match.mutate(body, { onSuccess: () => analysis.mutate(body) });
  };

  const retryAnalysis = () => {
    const body = payload();
    if (body) analysis.mutate(body);
  };

  const reset = () => {
    match.reset();
    analysis.reset();
    setBride(null);
    setGroom(null);
  };

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[1100px] px-5 pb-24 pt-10 sm:px-8">
        <header className="max-w-2xl">
          <span className={`text-[11px] text-gold ${eyebrow}`}>{t.milanEyebrow}</span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight text-paper sm:text-[32px]">
            {t.milanTitle}
          </h1>
          <p className="mt-3 text-[14.5px] leading-[1.7] text-muted">{t.milanSub}</p>
        </header>

        {match.data ? (
          <div className="mt-10 space-y-4">
            <MilanResult result={match.data} onReset={reset} />
            <MilanAnalysisPanel
              analysis={analysis.data}
              isPending={analysis.isPending}
              isError={analysis.isError}
              onRetry={retryAnalysis}
            />
          </div>
        ) : isLoading ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="h-[188px] animate-pulse rounded-[12px] border border-white/[0.07] bg-card" />
            <div className="h-[188px] animate-pulse rounded-[12px] border border-white/[0.07] bg-card" />
          </div>
        ) : (
          <>
            {/* The pair, joined. The rule behind the heart makes them one
                object rather than two unrelated cards. */}
            <div className="relative mt-10">
              <span
                aria-hidden
                className="absolute inset-x-0 top-1/2 hidden h-px bg-white/[0.08] md:block"
              />
              <div className="relative grid items-start gap-5 md:grid-cols-2 md:gap-16">
                <ChartPicker
                  role={t.milanBride}
                  accent="rose"
                  kundalis={kundalis}
                  selected={bride}
                  onSelect={setBride}
                  onCreate={() => setCreating(true)}
                />
                <ChartPicker
                  role={t.milanGroom}
                  accent="sky"
                  kundalis={kundalis}
                  selected={groom}
                  onSelect={setGroom}
                  onCreate={() => setCreating(true)}
                />
              </div>
              <span className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                <span className="grid size-11 place-items-center rounded-full border border-white/[0.09] bg-ink text-gold">
                  <Heart className="size-4" />
                </span>
              </span>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                disabled={!ready || match.isPending}
                onClick={run}
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-[8px] bg-gold px-6 py-3 text-[14px] font-bold text-ink transition-colors hover:bg-gold2 disabled:pointer-events-none disabled:opacity-40"
              >
                {match.isPending ? t.milanMatching : t.milanMatch}
                {!match.isPending && <ArrowRight className="size-4" />}
              </button>

              {/* Says which half is missing rather than leaving you to guess
                  why the button is dead. */}
              {!ready && (
                <p className="text-[12.5px] text-faint">
                  {sameChart ? t.milanSameChart : t.milanPickBoth}
                </p>
              )}

              {match.isError && (
                <p role="alert" className="text-[13px] text-rose-300">
                  {match.error.message}
                </p>
              )}
            </div>

            <WhatItChecks />
          </>
        )}
      </main>

      <CreateKundaliDialog open={creating} onClose={() => setCreating(false)} />
    </AppShell>
  );
}


/** What the match will actually compute — the page's teaching moment. */
function WhatItChecks() {
  const { t } = useTranslation();
  const label = useLatinTracking("uppercase tracking-[0.16em]");

  return (
    <section className="mt-16">
      <h2 className={`text-[10.5px] text-gold ${label}`}>{t.milanWhatWeCheck}</h2>

      <div className="mt-4 grid gap-px overflow-hidden rounded-[10px] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {KUTAS.map(([name, points]) => (
          <div key={name} className="flex items-baseline justify-between gap-2 bg-ink px-4 py-3.5">
            <span className="text-[13px] text-muted">{name}</span>
            <span className="text-[12px] text-faint">
              {points} <span className="text-[10px]">{t.milanGuna}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
