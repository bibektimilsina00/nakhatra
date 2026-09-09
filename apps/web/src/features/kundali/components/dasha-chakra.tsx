"use client";

import { useTranslation } from "@/lib/i18n/language-context";
import { YOGINI_DEV, isSanskrit } from "@/lib/i18n/patro-sanskrit";
import { getPlanetAbbrev, toLocalizedDigit } from "@/lib/i18n/vedic-translations";
import type { DashaPeriod } from "@/features/kundali/types";

export type DashaScheme = "vimshottari" | "tribhagi" | "yogini";

/**
 * A महादशाचक्रम् — the dasha as a hand-written patro tables it: one column per
 * mahadasha lord, with the period's years and the date it ends, the running
 * period inked in. This is the layout every hand-cast kundali uses, so a
 * reader can lay ours beside a guru's and compare cell by cell.
 *
 * The वर्ष row is each period's own span from the engine's dates (the first
 * column shows the balance actually remaining at birth, exactly as the end
 * dates imply — a patro prints the full span there and lets the dates carry
 * the balance, which reads as a contradiction; ours agree with our dates).
 */
export function DashaChakra({
  periods,
  now,
  scheme,
}: {
  periods: DashaPeriod[];
  now: number;
  scheme: DashaScheme;
}) {
  const { language } = useTranslation();
  const sk = isSanskrit(language);
  const n = (x: number | string) => toLocalizedDigit(x, language);

  const titles: Record<DashaScheme, [string, string]> = {
    vimshottari: ["अथ विंशोत्तरी महादशाचक्रम्", "Vimshottari Mahadasha Chakra"],
    tribhagi: ["अथ त्रिभागी महादशाचक्रम्", "Tribhagi Mahadasha Chakra"],
    yogini: ["अथ योगिनी महादशाचक्रम्", "Yogini Mahadasha Chakra"],
  };
  const rows: [string, string][] = [
    ["वर्ष", "Years"],
    ["साल (ई.)", "Ends (AD)"],
    ["महिना", "Month"],
    ["गते", "Day"],
  ];
  const label = (pair: [string, string]) => (sk ? pair[0] : pair[1]);

  const lordLabel = (lord: string) =>
    scheme === "yogini"
      ? sk
        ? (YOGINI_DEV[lord] ?? lord)
        : lord
      : sk
        ? getPlanetAbbrev(lord, language)
        : lord.slice(0, 3);

  return (
    <div className="overflow-hidden rounded-lg border-2 border-red-800/60 bg-[#f7efdc] text-[#26221b]">
      <p className="border-b-2 border-red-800/60 px-4 py-2 text-center font-serif text-sm font-bold tracking-wide text-red-800">
        {label(titles[scheme])}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center font-serif text-sm">
          <thead>
            <tr>
              <th className="border border-red-800/40 bg-red-800/[0.06] px-2 py-1.5 font-bold text-red-800">
                {sk ? "ग्र." : "Lord"}
              </th>
              {periods.map((p) => (
                <th
                  key={`${p.lord}-${p.start}`}
                  className={`border border-red-800/40 px-2 py-1.5 font-bold ${
                    isActive(p, now)
                      ? "bg-amber-300/50 text-red-900"
                      : "text-red-800"
                  }`}
                  title={`${p.lord}  ${p.start} → ${p.end}`}
                >
                  {lordLabel(p.lord)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((pair, rowIdx) => (
              <tr key={pair[1]}>
                <td className="border border-red-800/40 bg-red-800/[0.06] px-2 py-1.5 font-semibold text-red-800">
                  {label(pair)}
                </td>
                {periods.map((p) => {
                  const end = new Date(p.end);
                  const years = spanYears(p);
                  const cell = [
                    years,
                    end.getFullYear(),
                    end.getMonth() + 1,
                    end.getDate(),
                  ][rowIdx];
                  return (
                    <td
                      key={`${p.lord}-${p.start}-${pair[1]}`}
                      className={`border border-red-800/40 px-2 py-1.5 tabular-nums ${
                        isActive(p, now) ? "bg-amber-300/30 font-semibold" : ""
                      }`}
                    >
                      {n(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The period's own length in years, to one decimal when it isn't whole. */
function spanYears(p: DashaPeriod): string {
  const years =
    (new Date(p.end).getTime() - new Date(p.start).getTime()) /
    (365.25 * 24 * 3600 * 1000);
  const rounded = Math.round(years * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function isActive(p: DashaPeriod, now: number): boolean {
  return new Date(p.start).getTime() <= now && now < new Date(p.end).getTime();
}
