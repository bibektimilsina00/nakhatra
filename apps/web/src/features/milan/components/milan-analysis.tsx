"use client";

import {
  AlertTriangle,
  CheckCircle2,
  HandHeart,
  RotateCw,
  ShieldAlert,
  Sparkle,
} from "lucide-react";

import type { MilanAnalysis, MilanDosha, MilanPoint } from "@/features/milan/types";
import { useLatinTracking, useTranslation } from "@/lib/i18n/language-context";

/**
 * The astrologer's reading of a match.
 *
 * Sits under the score, never replaces it: the numbers above are computed and
 * the paragraphs here are interpretation, and the page has to keep those two
 * things visibly apart. That is why every point carries its `basis` — the koota
 * and the score it rests on — rather than floating free as an assertion.
 *
 * If the model fails, this whole block is replaced by a retry. The match is
 * already on screen and still useful without it.
 */
export function MilanAnalysisPanel({
  analysis,
  isPending,
  isError,
  onRetry,
}: {
  analysis: MilanAnalysis | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const label = useLatinTracking("uppercase tracking-[0.16em]");

  if (isPending) return <Analysing />;

  if (isError || !analysis) {
    return (
      <section className="rounded-[10px] border border-white/[0.09] bg-panel p-6 text-center">
        <p className="text-[13px] text-dim">{t.milanAnalysisFailed}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-[8px] border border-white/12 px-4 py-2 text-[12.5px] text-mut transition-colors hover:border-brd2 hover:text-fg"
        >
          <RotateCw className="size-3.5" />
          {t.milanRetry}
        </button>
      </section>
    );
  }

  const { strengths, concerns, doshas, remedies } = analysis;

  return (
    <div className="space-y-4">
      <section className="rounded-[10px] border border-white/[0.09] bg-panel p-6">
        <h2 className={`text-[10.5px] text-acc ${label}`}>{t.milanAnalysisTitle}</h2>
        <p className="mt-3 text-[17px] font-semibold leading-snug text-fg">
          {analysis.verdict}
        </p>
        <p className="mt-3 text-[13.5px] leading-[1.75] text-mut">{analysis.outlook}</p>
        <p className="mt-4 border-t border-white/[0.07] pt-3.5 text-[11.5px] leading-[1.6] text-dim">
          {t.milanAnalysisNote}
        </p>
      </section>

      {/* Side by side, and the same height, so neither column reads as the
          headline. A match is both of these at once. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PointList
          title={t.milanStrengths}
          points={strengths}
          tone="good"
          basisLabel={t.milanBasis}
        />
        <PointList
          title={t.milanConcerns}
          points={concerns}
          tone="warn"
          basisLabel={t.milanBasis}
        />
      </div>

      {doshas.length > 0 && (
        <section className="rounded-[10px] border border-white/[0.09] bg-panel p-5">
          <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-fg">
            <ShieldAlert className="size-4 text-dim" />
            {t.milanDoshas}
          </h3>
          <ul className="space-y-3">
            {doshas.map((dosha) => (
              <DoshaRow key={dosha.name} dosha={dosha} affectsLabel={t.milanAffects} />
            ))}
          </ul>
        </section>
      )}

      {remedies.length > 0 && (
        <section className="rounded-[10px] border border-white/[0.09] bg-panel p-5">
          <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-fg">
            <HandHeart className="size-4 text-dim" />
            {t.milanRemedies}
          </h3>
          {/* Plain bordered cards, not a hairline grid: an odd number of
              remedies left the grid's last cell empty and showing through. */}
          <ul className="grid gap-3 sm:grid-cols-2">
            {remedies.map((remedy) => (
              <li key={remedy.title} className="rounded-[8px] border border-white/[0.07] bg-app p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13px] font-medium text-fg">{remedy.title}</p>
                  <span className="shrink-0 text-[10.5px] text-acc">{remedy.timing}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-[1.7] text-dim">{remedy.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PointList({
  title,
  points,
  tone,
  basisLabel,
}: {
  title: string;
  points: MilanPoint[];
  tone: "good" | "warn";
  basisLabel: string;
}) {
  if (points.length === 0) return null;

  const Icon = tone === "good" ? CheckCircle2 : AlertTriangle;
  const colour = tone === "good" ? "text-emerald-400/80" : "text-acc";

  return (
    <section className="h-full rounded-[10px] border border-white/[0.09] bg-panel p-5">
      <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-fg">
        <Icon className={`size-4 ${colour}`} />
        {title}
      </h3>
      <ul className="space-y-4">
        {points.map((point) => (
          <li key={point.title}>
            <p className="text-[13px] font-medium text-fg">{point.title}</p>
            <p className="mt-1.5 text-[12.5px] leading-[1.7] text-mut">{point.detail}</p>
            {/* The score this rests on. Without it the paragraph above is an
                assertion; with it, the reader can check it against the bars. */}
            <p className="mt-2 text-[11px] text-dim">
              <span className="uppercase tracking-[0.1em]">{basisLabel}</span> · {point.basis}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DoshaRow({ dosha, affectsLabel }: { dosha: MilanDosha; affectsLabel: string }) {
  const { t } = useTranslation();

  const severity = {
    none: { text: t.milanSeverityNone, cls: "border-white/[0.10] bg-app text-dim" },
    mild: { text: t.milanSeverityMild, cls: "border-acc/25 bg-[#1A150B] text-acc2" },
    moderate: { text: t.milanSeverityModerate, cls: "border-acc/35 bg-[#1A150B] text-acc" },
    serious: { text: t.milanSeveritySerious, cls: "border-rose-400/30 bg-[#1A1013] text-rose-300/90" },
  }[dosha.severity];

  return (
    <li className="rounded-[8px] border border-white/[0.07] bg-app p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-fg">{dosha.name}</p>
        <span
          className={`shrink-0 rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${severity.cls}`}
        >
          {severity.text}
        </span>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.7] text-mut">{dosha.detail}</p>
      {dosha.affects && (
        <p className="mt-2 text-[11px] text-dim">
          <span className="uppercase tracking-[0.1em]">{affectsLabel}</span> · {dosha.affects}
        </p>
      )}
    </li>
  );
}

/** The reading takes real seconds. Say what is happening rather than spinning. */
function Analysing() {
  const { t } = useTranslation();
  const label = useLatinTracking("uppercase tracking-[0.16em]");

  return (
    <section className="rounded-[10px] border border-white/[0.09] bg-panel p-6">
      <h2 className={`text-[10.5px] text-acc ${label}`}>{t.milanAnalysisTitle}</h2>
      <p className="mt-3 flex items-center gap-2 text-[14px] font-medium text-fg">
        <Sparkle className="size-4 animate-pulse text-acc" />
        {t.milanAnalysing}
      </p>
      <p className="mt-2 max-w-md text-[12.5px] leading-[1.7] text-dim">
        {t.milanAnalysingNote}
      </p>
      <div className="mt-5 space-y-2.5">
        {[100, 92, 78].map((w) => (
          <div key={w} className="h-2.5 animate-pulse rounded-full bg-app" style={{ width: `${w}%` }} />
        ))}
      </div>
    </section>
  );
}
