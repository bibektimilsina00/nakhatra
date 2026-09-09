"use client";

import { useState } from "react";
import {
  HOUSE_ANCHORS,
  HOUSE_POLYGONS,
  PLANET_SLOT_OFFSET,
  S,
  toPoints,
} from "@/features/kundali/components/chart-geometry";
import type { Chart } from "@/features/kundali/types";
import { useTranslation } from "@/lib/i18n/language-context";
import { getPlanetAbbrev, toLocalizedDigit } from "@/lib/i18n/vedic-translations";

function getPlanetCoordinates(house: number, index: number, totalCount: number) {
  const anchor = HOUSE_ANCHORS[house];
  if (!anchor) return { x: 0, y: 0 };

  if (totalCount <= 2) {
    return {
      x: anchor.x,
      y: anchor.y + anchor.dir * (14 + index * 14),
    };
  }

  if (totalCount === 3) {
    return {
      x: anchor.x,
      y: anchor.y + anchor.dir * (13 + index * 12),
    };
  }

  // 4 or more planets (Stellium): 2-column grid layout so labels never cross house boundaries
  const row = Math.floor(index / 2);
  const col = index % 2;

  if (house === 4) {
    return {
      x: 88 + col * 24,
      y: 196 + (row === 0 ? -8 : row * 15),
    };
  }

  if (house === 10) {
    return {
      x: 288 + col * 24,
      y: 196 + (row === 0 ? -8 : row * 15),
    };
  }

  const dx = 12;
  const targetX = col === 0 ? anchor.x - dx : anchor.x + dx;
  const targetY = anchor.y + anchor.dir * (11 + row * 13);

  return { x: targetX, y: targetY };
}

/** The two looks a chart is drawn in: the app's dark sky, or the parchment
 *  and red-and-green ink of a hand-written patro. */
const CHART_THEMES = {
  dark: {
    svgBg: "bg-inset",
    fillA: "#090A10",
    fillB: "#121626",
    activeFill: "#1E2640",
    activeStroke: "#E5A93C",
    frame: "#E5A93C",
    lagnaNum: "#F3C766",
    num: "#CBD5E1",
    planet: "#FFFFFF",
    exalted: "#FDE68A",
    retro: "#E5A93C",
  },
  patro: {
    svgBg: "bg-[#f7efdc]",
    fillA: "#f7efdc",
    fillB: "#efe0c2",
    activeFill: "#ecd9b0",
    activeStroke: "#9B1C1C",
    frame: "#9B1C1C",
    lagnaNum: "#9B1C1C",
    num: "#4a3a22",
    planet: "#1a3a1a",
    exalted: "#9B1C1C",
    retro: "#9B1C1C",
  },
} as const;

export type ChartTheme = keyof typeof CHART_THEMES;

export function NorthIndianChart({
  chart,
  onSelectHouse,
  selectedHouse,
  theme = "dark",
}: {
  chart: Chart;
  onSelectHouse?: (house: number) => void;
  selectedHouse?: number | null;
  theme?: ChartTheme;
}) {
  const { language } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);
  const T = CHART_THEMES[theme];

  const planetsByHouse = new Map<number, typeof chart.planets>();
  for (const planet of chart.planets) {
    const list = planetsByHouse.get(planet.house) ?? [];
    list.push(planet);
    planetsByHouse.set(planet.house, list);
  }

  return (
    <svg
      viewBox={`-1 -1 ${S + 2} ${S + 2}`}
      className={`w-full max-w-[500px] select-none rounded-[8px] ${T.svgBg}`}
      role="img"
      aria-label="North Indian birth chart"
    >
      <defs>
        <linearGradient id={`chartFill-${theme}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={T.fillA} />
          <stop offset="100%" stopColor={T.fillB} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={S} height={S} fill={`url(#chartFill-${theme})`} />

      {/* House Polygon Highlights */}
      {Object.entries(HOUSE_POLYGONS).map(([key, polygon]) => {
        const house = Number(key);
        const active = hovered === house || selectedHouse === house;
        return (
          <polygon
            key={house}
            points={toPoints(polygon)}
            fill={active ? T.activeFill : "transparent"}
            stroke={active ? T.activeStroke : "transparent"}
            strokeWidth={active ? "1.5" : "0"}
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHovered(house)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectHouse?.(house)}
          />
        );
      })}

      {/* Frame, diagonals, inner diamond lines */}
      <g stroke={T.frame} strokeWidth="1.2" fill="none" pointerEvents="none">
        <rect x="0" y="0" width={S} height={S} strokeWidth="1.8" />
        <line x1="0" y1="0" x2={S} y2={S} strokeOpacity="0.75" />
        <line x1={S} y1="0" x2="0" y2={S} strokeOpacity="0.75" />
        <polygon points={`${S / 2},0 ${S},${S / 2} ${S / 2},${S} 0,${S / 2}`} strokeWidth="1.8" />
      </g>

      {/* Rashi Numbers and Planets */}
      {Object.entries(HOUSE_ANCHORS).map(([key, anchor]) => {
        const house = Number(key);
        const signIndex = chart.houses.find((h) => h.number === house)?.sign_index;
        const planets = planetsByHouse.get(house) ?? [];
        const isLagna = house === 1;

        return (
          <g key={house} pointerEvents="none">
            {/* Rashi Number */}
            <text
              x={anchor.x}
              y={anchor.y}
              textAnchor="middle"
              fontSize="14"
              fill={isLagna ? T.lagnaNum : T.num}
              fontWeight="700"
            >
              {signIndex === undefined ? "" : toLocalizedDigit(signIndex + 1, language)}
            </text>

            {/* Planets in House */}
            {planets.map((planet, i) => {
              const pos = getPlanetCoordinates(house, i, planets.length);
              const abbrev = getPlanetAbbrev(planet.name, language);
              return (
                <text
                  key={planet.name}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  fontSize={planets.length >= 4 ? "11.5" : "13"}
                  fontWeight="800"
                  fill={planet.dignity === "exalted" ? T.exalted : T.planet}
                  letterSpacing="0.3"
                >
                  {abbrev}
                  {planet.retrograde && (
                    <tspan fontSize="10" fill={T.retro} dy="-3" fontWeight="bold">
                      {language === "en" ? "℞" : " (व)"}
                    </tspan>
                  )}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
