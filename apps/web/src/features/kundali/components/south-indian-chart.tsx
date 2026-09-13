"use client";

import { useState } from "react";
import type { Chart } from "@/features/kundali/types";
import { useTranslation } from "@/lib/i18n/language-context";
import { getPlanetAbbrev, getSignName, toLocalizedDigit } from "@/lib/i18n/vedic-translations";

const SIGN_GRID: { row: number; col: number; signIndex: number; name: string }[] = [
  { row: 0, col: 0, signIndex: 11, name: "Pisces" },
  { row: 0, col: 1, signIndex: 0, name: "Aries" },
  { row: 0, col: 2, signIndex: 1, name: "Taurus" },
  { row: 0, col: 3, signIndex: 2, name: "Gemini" },
  { row: 1, col: 3, signIndex: 3, name: "Cancer" },
  { row: 2, col: 3, signIndex: 4, name: "Leo" },
  { row: 3, col: 3, signIndex: 5, name: "Virgo" },
  { row: 3, col: 2, signIndex: 6, name: "Libra" },
  { row: 3, col: 1, signIndex: 7, name: "Scorpio" },
  { row: 3, col: 0, signIndex: 8, name: "Sagittarius" },
  { row: 2, col: 0, signIndex: 9, name: "Capricorn" },
  { row: 1, col: 0, signIndex: 10, name: "Aquarius" },
];

export function SouthIndianChart({
  chart,
  onSelectHouse,
  selectedHouse,
  theme = "app",
}: {
  chart: Chart;
  onSelectHouse?: (house: number) => void;
  selectedHouse?: number | null;
  /** "dark" is the app's sky; "patro" is parchment and a guru's two inks. */
  theme?: "app" | "patro";
}) {
  const { language } = useTranslation();
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const patro = theme === "patro";
  // Both looks are drawn from tokens (design.md §7) — "patro" leans on the
  // tinted parchment surface, "dark" (the default) on the plain card surface.
  const T = patro
    ? {
        wrap: "bg-accent-tint",
        cellActive: "border-accent-strong bg-accent-wash",
        cell: "border-line-strong bg-accent-tint hover:border-accent-strong/60",
        lagnaText: "text-accent-strong",
        signText: "text-ink",
        houseText: "text-muted",
        planet: "text-ink",
        exalted: "bg-accent-strong/10 text-accent-strong",
        retro: "text-retrograde",
        center: "border-accent-strong/40 bg-accent-wash",
        centerTitle: "text-ink",
        centerAsc: "text-accent-strong",
        centerSub: "text-muted",
      }
    : {
        wrap: "bg-surface",
        cellActive: "border-accent bg-accent-wash",
        cell: "border-line-strong bg-surface hover:border-line-strong",
        lagnaText: "text-accent-strong",
        signText: "text-muted",
        houseText: "text-muted",
        planet: "text-ink",
        exalted: "bg-accent/20 text-accent-strong",
        retro: "text-retrograde",
        center: "border-line-strong bg-surface",
        centerTitle: "text-ink",
        centerAsc: "text-accent-strong",
        centerSub: "text-muted",
      };

  // Map planets by sign_index
  const planetsBySign = new Map<number, typeof chart.planets>();
  for (const planet of chart.planets) {
    const list = planetsBySign.get(planet.sign_index) ?? [];
    list.push(planet);
    planetsBySign.set(planet.sign_index, list);
  }

  // Find house number for a sign
  const getHouseNumber = (signIdx: number): number => {
    const house = chart.houses.find((h) => h.sign_index === signIdx);
    return house ? house.number : ((signIdx - chart.lagna_sign_index + 12) % 12) + 1;
  };

  const centerTitle =
    language === "ne"
      ? "दक्षिण भारतीय कुण्डली"
      : language === "hi"
      ? "दक्षिण भारतीय कुंडली"
      : "South Indian Chart";

  const housePrefix = language === "en" ? "H" : "भाव ";

  return (
    <div className={`w-full max-w-[500px] rounded-xl select-none ${T.wrap}`}>
      <div className="grid grid-cols-4 grid-rows-4 gap-1 aspect-square">
        {SIGN_GRID.map((cell) => {
          const houseNum = getHouseNumber(cell.signIndex);
          const planets = planetsBySign.get(cell.signIndex) ?? [];
          const isLagna = cell.signIndex === chart.lagna_sign_index;
          const isActive = hoveredHouse === houseNum || selectedHouse === houseNum;
          const localizedSign = getSignName(cell.name, language);

          return (
            <div
              key={cell.name}
              style={{ gridRowStart: cell.row + 1, gridColumnStart: cell.col + 1 }}
              onMouseEnter={() => setHoveredHouse(houseNum)}
              onMouseLeave={() => setHoveredHouse(null)}
              onClick={() => onSelectHouse?.(houseNum)}
              className={`relative cursor-pointer rounded-md border p-2 flex flex-col justify-between transition-all ${
                isActive ? T.cellActive : T.cell
              }`}
            >
              {/* Header inside sign box */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={isLagna ? T.lagnaText : T.signText}>
                  {localizedSign} {isLagna && (language === "en" ? "★ Asc" : "★ लग्न")}
                </span>
                <span className={`font-mono text-2xs ${T.houseText}`}>
                  {housePrefix}{toLocalizedDigit(houseNum, language)}
                </span>
              </div>

              {/* Planets inside sign box */}
              <div className="flex flex-wrap gap-1 my-auto text-xs font-bold">
                {planets.map((p) => (
                  <span
                    key={p.name}
                    className={`rounded px-1 text-2xs font-extrabold ${
                      p.dignity === "exalted" ? T.exalted : T.planet
                    }`}
                  >
                    {getPlanetAbbrev(p.name, language)}
                    {p.retrograde && (
                      <span className={`text-2xs ml-0.5 font-bold ${T.retro}`}>
                        {language === "en" ? "℞" : " (व)"}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Center Space of South Indian Chart Grid */}
        <div className={`col-start-2 col-end-4 row-start-2 row-end-4 rounded-md border p-4 flex flex-col items-center justify-center text-center space-y-1 ${T.center}`}>
          <span className={`font-display text-sm font-bold ${T.centerTitle}`}>{centerTitle}</span>
          <span className={`text-xs font-bold ${T.centerAsc}`}>
            {language === "en" ? "Ascendant" : "लग्न"}: {getSignName(chart.lagna_sign, language)}
          </span>
          <span className={`text-2xs ${T.centerSub}`}>
            {language === "ne"
              ? "स्थिर राशि · घडीको दिशा"
              : language === "hi"
              ? "स्थिर राशि · घड़ी की दिशा"
              : "Fixed Signs · Clockwise Layout"}
          </span>
        </div>
      </div>
    </div>
  );
}
