"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";

import type { Kuta, Manglik, MilanResponse } from "@/features/milan/types";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * The result of a match.
 *
 * The score leads, but the breakdown is the point: 28 of 36 means nothing until
 * you can see that the eight missing points are one koota. Bhakoot alone is
 * worth seven, so a "poor" total is often a single incompatibility rather than
 * a broadly bad match — a number handed over on its own hides exactly the thing
 * the couple needs to look at.
 */
export function MilanResult({
  result,
  onReset,
}: {
  result: MilanResponse;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const pct = Math.round(result.percentage);

  // Three bands, because the classical reading is three bands. The colour is
  // the same judgement the text makes, not an extra one.
  const band =
    pct >= 65
      ? { ring: "stroke-emerald-400", text: "text-emerald-300", label: t.milanGood }
      : pct >= 45
        ? { ring: "stroke-gold", text: "text-gold2", label: t.milanFair }
        : { ring: "stroke-rose-400", text: "text-rose-300", label: t.milanPoor };

  const circumference = 2 * Math.PI * 52;

  return (
    <div className="space-y-4">
      <section className="rounded-[10px] border border-white/[0.09] bg-card p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div className="relative shrink-0">
            <svg viewBox="0 0 120 120" className="size-[132px] -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none" strokeWidth="8" strokeLinecap="round"
                className={band.ring}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
              />
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <span className="text-[30px] font-bold leading-none text-paper">
                {result.total_guna}
              </span>
              <span className="mt-1 text-[12px] text-faint">of {result.max_guna}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-[13px] font-semibold uppercase tracking-[0.14em] ${band.text}`}>
              {band.label}
            </p>
            <h2 className="mt-2 text-[22px] font-bold leading-tight text-paper">
              {result.bride_name} &amp; {result.groom_name}
            </h2>
            <p className="mt-2 max-w-lg text-[13.5px] leading-[1.7] text-muted">
              {result.recommendation}
            </p>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="rounded-[8px] border border-white/12 px-4 py-2 text-[12.5px] text-muted transition-colors hover:border-white/25 hover:text-paper"
          >
            {t.milanNewMatch}
          </button>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-[10px] border border-white/[0.09] bg-card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-[13px] font-semibold text-paper">{t.milanKootaByKoota}</h3>
            <span className="text-[11px] text-faint">{t.milanBarNote}</span>
          </div>
          <ul className="space-y-3">
            {result.kutas.map((kuta) => (
              <KutaRow key={kuta.name} kuta={kuta} />
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <ManglikPanel
            title={t.milanManglik}
            bride={result.bride_manglik}
            groom={result.groom_manglik}
            brideName={result.bride_name}
            groomName={result.groom_name}
            compatible={result.manglik_compatibility.compatible}
            canceled={result.manglik_compatibility.canceled}
            reason={result.manglik_compatibility.reason}
          />
        </section>
      </div>
    </div>
  );
}

/** The heaviest koota, Nadi at 8, sets the scale every track is drawn against. */
const MAX_KUTA_POINTS = 8;

function KutaRow({ kuta }: { kuta: Kuta }) {
  const share = kuta.max_points > 0 ? kuta.obtained / kuta.max_points : 0;
  const zero = kuta.obtained === 0;

  return (
    <li>
      <div className="flex items-center gap-3">
        {/* Width by max_points, so the bar's length shows what the koota is
            worth as well as what it scored. Bhakoot at 7 and Varna at 1 are
            not the same loss. */}
        <span className={`w-24 shrink-0 text-[12.5px] ${zero ? "text-rose-300/85" : "text-muted"}`}>
          {kuta.name}
        </span>
        {/* The track's own width carries the koota's weight, so Varna at 1
            point is visibly a shorter bar than Nadi at 8 — otherwise the
            caption above is a claim the chart does not make. */}
        <span className="flex-1">
          <span
            className="block h-1.5 overflow-hidden rounded-full bg-ink"
            style={{ width: `${(kuta.max_points / MAX_KUTA_POINTS) * 100}%` }}
          >
            <span
              className={`block h-full rounded-full ${zero ? "bg-rose-500/70" : "bg-gold"}`}
              style={{ width: `${Math.max(share * 100, zero ? 0 : 4)}%` }}
            />
          </span>
        </span>
        <span className="w-10 shrink-0 text-right text-[11.5px] text-faint">
          {kuta.obtained}/{kuta.max_points}
        </span>
      </div>
      {kuta.description && (
        <p className="mt-1 pl-[108px] text-[11px] leading-[1.5] text-faint">{kuta.description}</p>
      )}
    </li>
  );
}

function ManglikPanel({
  title, bride, groom, brideName, groomName, compatible, canceled, reason,
}: {
  title: string;
  bride: Manglik;
  groom: Manglik;
  brideName: string;
  groomName: string;
  compatible: boolean;
  canceled: boolean;
  reason: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[10px] border border-white/[0.09] bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-paper">{title}</h3>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
            compatible
              ? "border-emerald-400/30 bg-[#0D1A16] text-emerald-300/90"
              : "border-rose-400/30 bg-[#1A1013] text-rose-300/90"
          }`}
        >
          {compatible ? <ShieldCheck className="size-3" /> : <AlertTriangle className="size-3" />}
          {canceled ? t.milanCancelled : compatible ? t.milanCompatible : t.milanCaution}
        </span>
      </div>

      <dl className="space-y-2.5">
        {[
          [brideName, bride],
          [groomName, groom],
        ].map(([name, side]) => {
          const person = side as Manglik;
          return (
            <div key={name as string} className="flex items-baseline justify-between gap-3">
              <dt className="truncate text-[12.5px] text-muted">{name as string}</dt>
              <dd className="shrink-0 text-[12px]">
                {person.is_manglik ? (
                  <span className="text-rose-300/85">
                    {t.milanIsManglik}
                    {person.houses.length > 0 && (
                      <span className="text-faint"> · {person.houses.join(", ")}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-faint">{t.milanNotManglik}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {reason && (
        <p className="mt-4 border-t border-white/[0.07] pt-3.5 text-[12px] leading-[1.7] text-faint">
          {reason}
        </p>
      )}
    </div>
  );
}
