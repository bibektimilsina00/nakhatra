"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BirthSky3D } from "@/features/kundali/components/birth-sky-3d";
import { NorthIndianChart } from "@/features/kundali/components/north-indian-chart";
import { saveKundaliToStorage } from "@/features/kundali/store/kundali-store";
import type { BirthDetailsIn, Chart } from "@/features/kundali/types";
import { Maximize2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";
import {
  getNakshatraName,
  getPlanetName,
  getSignName,
} from "@/lib/i18n/vedic-translations";

/**
 * Both charts, side by side.
 *
 * The kootas are a verdict on two charts the couple never got to see. This
 * puts them back: each partner's D1, then the nine grahas in one table with a
 * column each, so "Graha Maitri 3/5" stops being a number and becomes Jupiter
 * facing Saturn. Rows where both sit in the same sign are marked — a shared
 * sign is the thing a reader looks for first, and it is invisible in a score.
 */
export function MilanCharts({
  brideName,
  brideChart,
  brideBirth,
  groomName,
  groomChart,
  groomBirth,
}: {
  brideName: string;
  brideChart: Chart;
  brideBirth?: BirthDetailsIn | null;
  groomName: string;
  groomChart: Chart;
  groomBirth?: BirthDetailsIn | null;
}) {
  const { language } = useTranslation();
  const [open, setOpen] = useState(false);

  const title =
    language === "ne"
      ? "दुवैको जन्मकुण्डली"
      : language === "hi"
        ? "दोनों की जन्मकुंडली"
        : "Both charts";
  const sub =
    language === "ne"
      ? "एउटै ठाउँमा राखेर तुलना गर्नुहोस्"
      : language === "hi"
        ? "एक साथ रखकर तुलना करें"
        : "Side by side, to compare";

  return (
    <section className="rounded-[12px] border border-brd bg-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold text-fg">{title}</h3>
          <p className="mt-0.5 text-[11px] text-mut">{sub}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer rounded-[8px] border border-brd px-3 py-1.5 text-[11.5px] font-medium text-mid transition-colors hover:border-acc/50 hover:text-acc2"
        >
          {open
            ? language === "ne"
              ? "ग्रहस्थिति लुकाउनुहोस्"
              : language === "hi"
                ? "ग्रह स्थिति छिपाएं"
                : "Hide positions"
            : language === "ne"
              ? "ग्रहस्थिति हेर्नुहोस्"
              : language === "hi"
                ? "ग्रह स्थिति देखें"
                : "Compare positions"}
        </button>
      </div>

      {/* The sky each was born under, side by side. The kootas are a claim
          about two skies; this is the pair of skies themselves. */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SkyCard name={brideName} chart={brideChart} birth={brideBirth} />
        <SkyCard name={groomName} chart={groomChart} birth={groomBirth} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ChartCard name={brideName} chart={brideChart} />
        <ChartCard name={groomName} chart={groomChart} />
      </div>

      {open && (
        <PlanetComparison
          brideName={brideName}
          brideChart={brideChart}
          groomName={groomName}
          groomChart={groomChart}
        />
      )}
    </section>
  );
}

/** One partner's birth sky. Expanding hands that partner's chart to /sky,
 *  which reads whichever kundali is active — so the couple can open either. */
function SkyCard({
  name,
  chart,
  birth,
}: {
  name: string;
  chart: Chart;
  birth?: BirthDetailsIn | null;
}) {
  const { language } = useTranslation();
  const router = useRouter();

  const open = () => {
    if (!birth) return;
    saveKundaliToStorage(birth, chart);
    router.push("/sky");
  };

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-brd bg-[#090A10]">
      <div className="pointer-events-none h-[230px]">
        <BirthSky3D
          chart={chart}
          selected={null}
          onSelect={() => {}}
          showNakshatras={false}
          showAspects={false}
          hint={false}
          planetLabels={false}
          wheelZoom={false}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-[#090A10] via-[#090A10]/80 to-transparent p-3.5">
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold text-white">{name}</span>
          <span className="mt-0.5 block text-[10.5px] text-white/60">
            {language === "ne"
              ? "जन्मकालीन आकाश"
              : language === "hi"
                ? "जन्मकालीन आकाश"
                : "Birth sky"}
          </span>
        </span>
        {birth && (
          <button
            type="button"
            onClick={open}
            aria-label={language === "en" ? "Open the birth sky" : "जन्म आकाश खोल्नुहोस्"}
            className="pointer-events-auto grid size-8 shrink-0 cursor-pointer place-items-center rounded-[8px] bg-acc text-onacc transition hover:bg-acc2 active:scale-95"
          >
            <Maximize2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ChartCard({ name, chart }: { name: string; chart: Chart }) {
  const { language, t } = useTranslation();
  return (
    <div className="rounded-[10px] border border-brd bg-inset p-3.5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="truncate text-[13px] font-semibold text-fg">{name}</span>
        <span className="shrink-0 text-[11px] text-mut">
          {getSignName(chart.lagna_sign, language)} {t.ascendantLabel}
        </span>
      </div>
      <NorthIndianChart chart={chart} />
    </div>
  );
}

/** A degree as a reader writes it: whole degrees and minutes. */
function deg(value: number): string {
  const d = Math.floor(value);
  const m = Math.round((value - d) * 60);
  return m === 60 ? `${d + 1}°00'` : `${d}°${String(m).padStart(2, "0")}'`;
}

function PlanetComparison({
  brideName,
  brideChart,
  groomName,
  groomChart,
}: {
  brideName: string;
  brideChart: Chart;
  groomName: string;
  groomChart: Chart;
}) {
  const { language } = useTranslation();

  const byName = new Map(groomChart.planets.map((p) => [p.name, p]));
  const houseWord = language === "en" ? "H" : "भा";

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="border-b border-brd text-[10px] uppercase tracking-[0.1em] text-mut">
            <th className="pb-2 pr-3 font-semibold">
              {language === "ne" ? "ग्रह" : language === "hi" ? "ग्रह" : "Graha"}
            </th>
            <th className="pb-2 pr-3 font-semibold">
              <span className="block truncate text-fg">{brideName}</span>
            </th>
            <th className="pb-2 font-semibold">
              <span className="block truncate text-fg">{groomName}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {brideChart.planets.map((b) => {
            const g = byName.get(b.name);
            // A shared sign is the first thing a reader looks for and the one
            // thing a total out of 36 cannot show.
            const shared = g?.sign === b.sign;
            const moon = b.name === "Moon";
            return (
              <tr
                key={b.name}
                className={`border-b border-brd/60 last:border-0 ${
                  moon ? "bg-acc/[0.06]" : ""
                }`}
              >
                <td className="py-2 pr-3 align-top">
                  <span className={`text-[12.5px] font-medium ${moon ? "text-acc2" : "text-fg"}`}>
                    {getPlanetName(b.name, language)}
                  </span>
                  {moon && (
                    <span className="ml-1.5 text-[9px] uppercase tracking-wider text-acc">
                      {language === "ne" || language === "hi" ? "मिलानको आधार" : "matched on"}
                    </span>
                  )}
                </td>
                <PositionCell planet={b} shared={shared} houseWord={houseWord} />
                {g ? (
                  <PositionCell planet={g} shared={shared} houseWord={houseWord} />
                ) : (
                  <td className="py-2 text-[12px] text-dim">—</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-3 text-[11px] leading-[1.6] text-mut">
        {language === "ne"
          ? "उही राशिमा परेका ग्रह सुनौलो रङमा देखाइएका छन् — चन्द्रमा नै अष्टकूट मिलानको आधार हो।"
          : language === "hi"
            ? "एक ही राशि में पड़े ग्रह सुनहरे रंग में दिखाए गए हैं — चंद्रमा ही अष्टकूट मिलान का आधार है।"
            : "Grahas sharing a sign are marked in gold. The Moon is what the ashtakoota is measured from."}
      </p>
    </div>
  );
}

function PositionCell({
  planet,
  shared,
  houseWord,
}: {
  planet: Chart["planets"][number];
  shared: boolean;
  houseWord: string;
}) {
  const { language } = useTranslation();
  return (
    <td className="py-2 pr-3 align-top">
      <span
        className={`block text-[12.5px] ${shared ? "font-semibold text-acc2" : "text-fg"}`}
      >
        {getSignName(planet.sign, language)}
        {planet.retrograde && <span className="ml-1 text-[10px] text-rose-400">℞</span>}
      </span>
      <span className="mt-0.5 block font-mono text-[10.5px] tabular-nums text-mut">
        {deg(planet.degree_in_sign)} · {houseWord}
        {planet.house}
      </span>
      {planet.nakshatra && (
        <span className="mt-0.5 block text-[10.5px] text-dim">
          {getNakshatraName(planet.nakshatra.name, language)} {planet.nakshatra.pada}
        </span>
      )}
    </td>
  );
}
