"use client";

import { AlertTriangle, ArrowRight, Headphones, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { saveKundaliToStorage } from "@/features/kundali/store/kundali-store";
import { milanLiveFrom, saveMilanLive } from "@/features/milan/store/milan-live";

import { MilanCharts } from "@/features/milan/components/milan-charts";
import { kutaName, kutaTerm, KUTA_MEANING, MANGLIK_REASONS, VERDICTS } from "@/features/milan/kuta-i18n";
import type { BirthDetailsIn } from "@/features/kundali/types";
import type { Kuta, Manglik, MilanResponse } from "@/features/milan/types";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * The result of a match.
 *
 * The score leads, but the breakdown is the point: 21 of 36 means nothing until
 * you can see that eight of the missing points are one koota. So the kootas
 * that scored nothing are lifted out and named first, and only then does the
 * full eight-card grid follow — a number handed over on its own hides exactly
 * the thing the couple came to look at.
 */
export function MilanResult({
  result,
  onReset,
  brideBirth,
  groomBirth,
}: {
  result: MilanResponse;
  onReset: () => void;
  /** Passed through so each birth sky can open full screen. */
  brideBirth?: BirthDetailsIn | null;
  groomBirth?: BirthDetailsIn | null;
}) {
  const { t, language } = useTranslation();
  const router = useRouter();
  const pct = Math.round(result.percentage);

  // Take the match to the astrologer: the consultation opens on the bride's
  // chart with the groom's and the finished score alongside it.
  const askAboutMatch = () => {
    if (!brideBirth) return;
    const live = milanLiveFrom(result, brideBirth);
    if (!live) return;
    saveMilanLive(live);
    saveKundaliToStorage(live.self.birth, live.self.chart);
    router.push("/reading/live");
  };

  // Three bands, because the classical reading is three bands. The colour is
  // the same judgement the text makes, not an extra one.
  const key = result.verdict || (pct >= 78 ? "uttam" : pct >= 50 ? "madhyam" : "varjya");
  const verdict = VERDICTS[key] ?? VERDICTS.madhyam;
  const band =
    key === "uttam"
      ? { ring: "stroke-emerald-400", text: "text-emerald-400" }
      : key === "madhyam"
        ? { ring: "stroke-acc", text: "text-acc2" }
        : { ring: "stroke-rose-400", text: "text-rose-400" };

  const circumference = 2 * Math.PI * 52;
  const failing = result.kutas.filter((k) => k.obtained === 0);
  const partial = result.kutas.filter((k) => k.obtained > 0 && k.obtained < k.max_points);

  return (
    <div className="space-y-4">
      {/* The verdict */}
      <section className="rounded-[12px] border border-brd bg-panel p-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
          <div className="relative shrink-0">
            <svg viewBox="0 0 120 120" className="size-[132px] -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" className="stroke-inset" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none" strokeWidth="8" strokeLinecap="round"
                className={band.ring}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
              />
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <span className="text-[32px] font-bold leading-none text-fg">
                {result.total_guna}
              </span>
              <span className="mt-1 text-[12px] text-dim">/ {result.max_guna}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-bold uppercase tracking-[0.16em] ${band.text}`}>
              {verdict.label[language]}
            </p>
            <h2 className="mt-1.5 font-serif text-[22px] font-bold leading-tight text-fg">
              {result.bride_name} &amp; {result.groom_name}
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-[1.7] text-mid">
              {verdict.blurb[language]}
            </p>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="shrink-0 cursor-pointer rounded-[8px] border border-brd px-4 py-2 text-[12.5px] font-medium text-mid transition-colors hover:border-acc/50 hover:text-acc2"
          >
            {t.milanNewMatch}
          </button>
        </div>
      </section>

      {/* The match, taken to the astrologer. */}
      {brideBirth && result.bride_chart && result.groom_chart && (
        <button
          type="button"
          onClick={askAboutMatch}
          className="group flex w-full cursor-pointer items-center gap-3.5 rounded-[12px] bg-acc p-4 text-left text-onacc shadow-lg transition hover:bg-acc2 active:scale-[0.99]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-onacc/15">
            <Headphones className="size-5 transition-transform group-hover:scale-110" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold leading-tight">
              {language === "ne"
                ? "यो मिलानबारे ज्योतिषीसँग सोध्नुहोस्"
                : language === "hi"
                  ? "इस मिलान के बारे में ज्योतिषी से पूछें"
                  : "Ask the astrologer about this match"}
            </span>
            <span className="mt-0.5 block text-[11px] font-medium opacity-80">
              {language === "ne"
                ? "दुवै कुण्डली हेरेर आवाजमै वा लेखेर कुराकानी गर्नुहोस्"
                : language === "hi"
                  ? "दोनों कुंडली देखकर आवाज़ में या लिखकर बात करें"
                  : "Both charts in hand — talk by voice, or type"}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {result.bride_chart && result.groom_chart && (
        <MilanCharts
          brideName={result.bride_name}
          brideChart={result.bride_chart}
          brideBirth={brideBirth}
          groomName={result.groom_name}
          groomChart={result.groom_chart}
          groomBirth={groomBirth}
        />
      )}

      {/* What the score is actually made of */}
      {(failing.length > 0 || partial.length > 0) && (
        <section className="rounded-[12px] border border-brd bg-inset p-5">
          <h3 className="text-[13px] font-semibold text-fg">
            {language === "ne"
              ? "ध्यान दिनुपर्ने कूटहरू"
              : language === "hi"
                ? "ध्यान देने योग्य कूट"
                : "Where the points went"}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {failing.map((k) => (
              <span
                key={k.name}
                className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[12px] font-medium text-rose-400"
              >
                {kutaName(k.key, k.name, language)}
                <span className="text-[11px] opacity-80">&minus;{k.max_points}</span>
              </span>
            ))}
            {partial.map((k) => (
              <span
                key={k.name}
                className="inline-flex items-center gap-2 rounded-full border border-acc/30 bg-acc/10 px-3 py-1.5 text-[12px] font-medium text-acc2"
              >
                {kutaName(k.key, k.name, language)}
                <span className="text-[11px] opacity-80">
                  &minus;{Math.round((k.max_points - k.obtained) * 10) / 10}
                </span>
              </span>
            ))}
          </div>
          {failing.length > 0 && (
            <p className="mt-3 text-[12px] leading-[1.7] text-mut">
              {language === "ne"
                ? "शून्य अंक आएका कूटले सम्बन्ध असम्भव भन्दैन — कुन पक्षमा सचेत हुनुपर्ने हो त्यो देखाउँछ। यी विषयमा गुरुसँग परामर्श गर्नुहोस्।"
                : language === "hi"
                  ? "शून्य अंक वाले कूट रिश्ते को असंभव नहीं कहते — वे बताते हैं किस पक्ष में सजग रहना है। इन विषयों पर गुरु से परामर्श करें।"
                  : "A koota at zero does not forbid the match — it names the area to be conscious of. These are the points worth taking to a guru."}
            </p>
          )}
        </section>
      )}

      {/* The eight, each with what it weighs */}
      <section className="rounded-[12px] border border-brd bg-panel p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-fg">{t.milanKootaByKoota}</h3>
          <span className="text-[11px] text-dim">{t.milanBarNote}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.kutas.map((kuta) => (
            <KutaCard key={kuta.name} kuta={kuta} />
          ))}
        </div>
      </section>

      <ManglikPanel
        title={t.milanManglik}
        bride={result.bride_manglik}
        groom={result.groom_manglik}
        brideName={result.bride_name}
        groomName={result.groom_name}
        compatible={result.manglik_compatibility.compatible}
        canceled={result.manglik_compatibility.canceled}
        reason={
          MANGLIK_REASONS[result.manglik_compatibility.reason_key]?.[language] ??
          result.manglik_compatibility.reason
        }
      />
    </div>
  );
}

/** The heaviest koota, Nadi at 8, sets the scale every track is drawn against. */
const MAX_KUTA_POINTS = 8;

function KutaCard({ kuta }: { kuta: Kuta }) {
  const { language } = useTranslation();
  const share = kuta.max_points > 0 ? kuta.obtained / kuta.max_points : 0;
  const zero = kuta.obtained === 0;
  const full = kuta.obtained === kuta.max_points;
  const groom = kutaTerm(kuta.groom_value, language);
  const bride = kutaTerm(kuta.bride_value, language);
  const pair = kuta.key !== "bhakoot" && kuta.key !== "tara" && Boolean(groom && bride);

  return (
    <div
      className={`rounded-[10px] border p-3.5 ${
        zero ? "border-rose-400/30 bg-rose-500/[0.06]" : "border-brd bg-inset"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-[13px] font-semibold ${zero ? "text-rose-400" : "text-fg"}`}>
          {kutaName(kuta.key, kuta.name, language)}
        </span>
        <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-mut">
          <span className={zero ? "text-rose-400" : full ? "text-acc2" : "text-fg"}>
            {kuta.obtained}
          </span>
          <span className="text-dim">/{kuta.max_points}</span>
        </span>
      </div>

      <p className="mt-0.5 text-[11px] leading-[1.5] text-mut">
        {KUTA_MEANING[kuta.key]?.[language] ?? ""}
      </p>

      {/* Track width carries the koota's weight, so Varna at 1 point is
          visibly a shorter bar than Nadi at 8 — otherwise the note above is
          a claim the chart does not make. */}
      <span
        className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-app"
        style={{ width: `${(kuta.max_points / MAX_KUTA_POINTS) * 100}%` }}
      >
        <span
          className={`block h-full rounded-full ${zero ? "bg-rose-400/70" : "bg-acc"}`}
          style={{ width: `${Math.max(share * 100, zero ? 0 : 4)}%` }}
        />
      </span>

      {pair && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-mid">
          <span className="font-medium">{groom}</span>
          <span className="text-dim">·</span>
          <span className="font-medium">{bride}</span>
        </p>
      )}
    </div>
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
    <section className="rounded-[12px] border border-brd bg-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-fg">{title}</h3>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
            compatible
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-400/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          {compatible ? <ShieldCheck className="size-3" /> : <AlertTriangle className="size-3" />}
          {canceled ? t.milanCancelled : compatible ? t.milanCompatible : t.milanCaution}
        </span>
      </div>

      <dl className="grid gap-2.5 sm:grid-cols-2">
        {[
          [brideName, bride],
          [groomName, groom],
        ].map(([name, side]) => {
          const person = side as Manglik;
          return (
            <div
              key={name as string}
              className="flex items-baseline justify-between gap-3 rounded-[8px] border border-brd bg-inset px-3.5 py-2.5"
            >
              <dt className="truncate text-[12.5px] text-mid">{name as string}</dt>
              <dd className="shrink-0 text-[12px]">
                {person.is_manglik ? (
                  <span className="font-medium text-rose-400">
                    {t.milanIsManglik}
                    {person.houses.length > 0 && (
                      <span className="text-dim"> · {person.houses.join(", ")}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-mut">{t.milanNotManglik}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {reason && (
        <p className="mt-4 border-t border-brd pt-3.5 text-[12px] leading-[1.7] text-mut">
          {reason}
        </p>
      )}
    </section>
  );
}
