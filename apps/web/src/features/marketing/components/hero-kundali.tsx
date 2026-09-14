"use client";

import { useEffect, useState } from "react";

import demo from "@/features/marketing/demo-chart.json";
import type { Chart } from "@/features/kundali/types";

const { chart } = demo as unknown as { chart: Chart };

/**
 * The twelve houses of a North Indian chart, as clickable regions.
 *
 * The frame is a square with an inscribed diamond and both diagonals; the
 * twelve regions those lines create are the houses. Laid out in the standard
 * arrangement — house 1 at the top centre, counting anticlockwise.
 */
const HOUSES: { n: number; d: string; label: [number, number] }[] = [
  { n: 1, d: "M50 0 L75 25 L50 50 L25 25 Z", label: [50, 22] },
  { n: 2, d: "M50 0 L25 25 L0 0 Z", label: [25, 9] },
  { n: 3, d: "M0 0 L25 25 L0 50 Z", label: [9, 25] },
  { n: 4, d: "M0 50 L25 25 L50 50 L25 75 Z", label: [25, 50] },
  { n: 5, d: "M0 50 L25 75 L0 100 Z", label: [9, 75] },
  { n: 6, d: "M0 100 L25 75 L50 100 Z", label: [25, 91] },
  { n: 7, d: "M50 100 L25 75 L50 50 L75 75 Z", label: [50, 78] },
  { n: 8, d: "M50 100 L75 75 L100 100 Z", label: [75, 91] },
  { n: 9, d: "M100 100 L75 75 L100 50 Z", label: [91, 75] },
  { n: 10, d: "M100 50 L75 75 L50 50 L75 25 Z", label: [75, 50] },
  { n: 11, d: "M100 50 L75 25 L100 0 Z", label: [91, 25] },
  { n: 12, d: "M100 0 L75 25 L50 0 Z", label: [75, 9] },
];

const ABBREV: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};

/**
 * A real chart behind the hero copy, drawn faintly.
 *
 * Ambient rather than decorative: a house lights in sequence every couple of
 * seconds, and hovering one holds it. The data is a genuine ephemeris result,
 * so the planets sitting in each house are where they actually were.
 *
 * It sits behind text, so it must never take a click that was meant for a link:
 * the group is `pointer-events-none` and only the house shapes opt back in.
 */
export function HeroKundali() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [cycled, setCycled] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setCycled((h) => (h % 12) + 1), 2600);
    return () => clearInterval(timer);
  }, []);

  const active = hovered ?? cycled;
  const planetsIn = (n: number) => chart.planets.filter((p) => p.house === n);

  return (
    <svg
      viewBox="-2 -2 104 104"
      aria-hidden="true"
      className="pointer-events-none h-full w-full"
    >
      <g fill="none" stroke="var(--color-accent)" strokeOpacity="0.16" strokeWidth="0.4">
        <rect x="0" y="0" width="100" height="100" />
        <path d="M50 0 L100 50 L50 100 L0 50 Z" />
        <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity="0.1" />
      </g>

      {HOUSES.map(({ n, d, label }) => {
        const on = active === n;
        const planets = planetsIn(n);
        return (
          <g key={n}>
            <path
              d={d}
              className="pointer-events-auto cursor-default transition-[fill] duration-500"
              fill={on ? "var(--color-accent)" : "transparent"}
              fillOpacity={on ? 0.07 : 0}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
            />
            {planets.length > 0 && (
              <text
                x={label[0]}
                y={label[1]}
                textAnchor="middle"
                className="select-none transition-opacity duration-500"
                fill={on ? "var(--color-accent-ink)" : "var(--color-accent)"}
                fillOpacity={on ? 0.85 : 0.3}
                fontSize="3.4"
                fontFamily="ui-monospace, monospace"
              >
                {planets.map((p) => ABBREV[p.name] ?? p.name.slice(0, 2)).join(" ")}
              </text>
            )}
          </g>
        );
      })}

      {/* The lagna, marked where a chart marks it. */}
      <text
        x="50" y="8"
        textAnchor="middle"
        fill="var(--color-accent)"
        fillOpacity="0.45"
        fontSize="3"
        fontFamily="ui-monospace, monospace"
        className="select-none"
      >
        {chart.lagna_sign_index + 1}
      </text>
    </svg>
  );
}
