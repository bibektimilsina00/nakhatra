"use client";

import { useState } from "react";

import { AB, BODIES, degIn, navamsa, SIGNS, type Body, type Sky } from "@/features/marketing/ephemeris";

/** The twelve regions a North Indian chart's frame cuts, house 1 at the top. */
const SHAPES = [
  "M50 0 L75 25 L50 50 L25 25 Z", "M50 0 L25 25 L0 0 Z", "M0 0 L25 25 L0 50 Z",
  "M0 50 L25 25 L50 50 L25 75 Z", "M0 50 L25 75 L0 100 Z", "M0 100 L25 75 L50 100 Z",
  "M50 100 L25 75 L50 50 L75 75 Z", "M50 100 L75 75 L100 100 Z", "M100 100 L75 75 L100 50 Z",
  "M100 50 L75 75 L50 50 L75 25 Z", "M100 50 L75 25 L100 0 Z", "M100 0 L75 25 L50 0 Z",
];
const CELLS: [number, number][] = [
  [50, 20], [25, 10], [10, 25], [25, 50], [10, 75], [25, 90],
  [50, 80], [75, 90], [90, 75], [75, 50], [90, 25], [75, 10],
];

export type Focus = { chart: string; house: number } | null;

export function LiveChart({
  id, sky, isD9, selected, onFocus, onSelect,
}: {
  id: string;
  sky: Sky;
  isD9: boolean;
  selected: Focus;
  onFocus: (f: Focus) => void;
  onSelect: (f: Focus) => void;
}) {
  const lagnaSign = isD9 ? navamsa(sky.Lagna) : Math.floor(sky.Lagna / 30);
  const signOf = (b: Body) => (isD9 ? navamsa(sky[b]) : Math.floor(sky[b] / 30));

  return (
    <svg viewBox="-2 -2 104 104" className="w-full">
      <g fill="none" stroke="var(--color-accent)" strokeOpacity=".42" strokeWidth=".7">
        <rect x="0" y="0" width="100" height="100" />
        <path d="M50 0 L100 50 L50 100 L0 50 Z" />
        <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".22" />
      </g>
      <g>
        {SHAPES.map((d, i) => {
          const sign = (lagnaSign + i) % 12;
          const here = BODIES.filter((b) => signOf(b) === sign).map((b) => AB[b]);
          const lines: string[] = [];
          for (let k = 0; k < here.length; k += 2) lines.push(here.slice(k, k + 2).join(" "));
          const on = selected?.chart === id && selected.house === i;
          const [cx, cy] = CELLS[i];
          return (
            <g key={i}>
              <path
                d={d}
                className={`cell${i === 0 ? " lagna" : ""}${on ? " sel" : ""}`}
                onMouseEnter={() => onFocus({ chart: id, house: i })}
                onMouseLeave={() => onFocus(null)}
                onClick={() => onSelect(on ? null : { chart: id, house: i })}
              />
              <text
                className="cellt"
                textAnchor="middle"
                fontSize="3.7"
                fontFamily="ui-monospace,monospace"
              >
                {lines.map((ln, k) => (
                  <tspan key={k} x={cx} y={cy + (k - (lines.length - 1) / 2) * 4.6}>
                    {ln}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** The line under the charts: a focused house, or the clock. */
export function ChartCaption({ sky, focus, isD9 }: { sky: Sky; focus: Focus; isD9: boolean }) {
  if (focus) {
    const lagnaSign = isD9 ? navamsa(sky.Lagna) : Math.floor(sky.Lagna / 30);
    const sign = (lagnaSign + focus.house) % 12;
    const here = BODIES.filter(
      (b) => (isD9 ? navamsa(sky[b]) : Math.floor(sky[b] / 30)) === sign,
    ).map((b) => `${AB[b]} ${degIn(sky[b], isD9).toFixed(1)}°`);
    return (
      <>
        <span className="text-accent-ink">
          House {focus.house + 1} · {SIGNS[sign]}
        </span>
        <br />
        {here.join("  ") || "empty"}
      </>
    );
  }
  return (
    <>
      {sky.at.toUTCString().slice(5, 22)} UT
      <br />
      Lagna {SIGNS[Math.floor(sky.Lagna / 30)]} {(sky.Lagna % 30).toFixed(1)}° ·{" "}
      Moon {SIGNS[Math.floor(sky.Moon / 30)]}
    </>
  );
}

export function useChartFocus() {
  const [hover, setHover] = useState<Focus>(null);
  const [pinned, setPinned] = useState<Focus>(null);
  return { focus: hover ?? pinned, pinned, setHover, setPinned };
}
