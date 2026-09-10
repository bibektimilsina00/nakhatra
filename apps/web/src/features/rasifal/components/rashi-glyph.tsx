/**
 * The twelve rashi symbols, drawn.
 *
 * Not the Unicode zodiac characters: those resolve to whatever emoji font the
 * device happens to ship, so the set arrives in twelve different weights and
 * half of them in colour. These are one stroke weight on one 24-unit grid,
 * built from the canonical glyph forms — the ram's horns, the bull's crescent,
 * Virgo's crossed loop — and they inherit `currentColor` like any other icon.
 *
 * Drawn with round caps and joins: a zodiac symbol is a calligraphic mark, and
 * mitred corners make it read as a diagram.
 */
const PATHS: Record<number, string> = {
  // मेष — the ram: two horns curling outward from a shared stem
  0: "M12 21V9M12 9C12 6.24 9.76 4 7 4S2.5 6 2.5 8.25 4 12 6 12M12 9c0-2.76 2.24-5 5-5s4.5 2 4.5 4.25S20 12 18 12",
  // वृष — the bull: a full face beneath crescent horns
  1: "M12 21.5a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5ZM3.5 3.5c0 4 3.8 7.5 8.5 7.5s8.5-3.5 8.5-7.5",
  // मिथुन — the twins: two figures under a shared roof
  2: "M4.5 3.5c5 1.6 10 1.6 15 0M4.5 20.5c5-1.6 10-1.6 15 0M9 4.6v14.8M15 4.6v14.8",
  // कर्कट — the crab: two claws, curled against each other
  3: "M2.5 7.5c3.2-2.6 8.4-2.6 11.6 0M21.5 16.5c-3.2 2.6-8.4 2.6-11.6 0M6 6.6a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8ZM18 11.6a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8Z",
  // सिंह — the lion: the mane's loop running out into a tail
  4: "M4.6 11.4c-.9-2.9-.2-6 2.4-7.4 2.9-1.6 6.3.2 6.6 3.3.2 2.2-1 3.6-1 5.4 0 2 1.6 3.4 3.5 3.4 1.6 0 2.7-.8 3.4-2M4.6 11.4a3.2 3.2 0 1 0 1.8 5.9c1.3-.8 1.7-2.4 1-3.7",
  // कन्या — the maiden: three strokes, the last crossed by a loop
  5: "M3.5 5v11M3.5 7c0-1.5 1.05-2.4 2.35-2.4S8.2 5.5 8.2 7v9M8.2 7c0-1.5 1.05-2.4 2.35-2.4S12.9 5.5 12.9 7v9M12.9 7c0-1.5 1.05-2.4 2.35-2.4S17.6 5.5 17.6 7v6.2c0 2.6 1.5 4.3 3.4 4.9M17.6 13.2c-1.5 1.5-1.9 3.6-.9 5.4",
  // तुला — the scales: the sun rising over the horizon
  6: "M3 19.5h18M3 12.8h6.1a4.6 4.6 0 0 1 9.8 0H21",
  // वृश्चिक — the scorpion: three strokes, the last a barbed tail
  7: "M2.5 5.6v10.8M2.5 7.6c0-1.5 1.05-2.4 2.35-2.4S7.2 6.1 7.2 7.6v8.8M7.2 7.6c0-1.5 1.05-2.4 2.35-2.4S11.9 6.1 11.9 7.6v8.8M11.9 7.6c0-1.5 1.05-2.4 2.35-2.4S16.6 6.1 16.6 7.6v10.8h4.4M18.6 16.2l2.4 2.2-2.4 2.2",
  // धनु — the archer: the arrow, crossed
  8: "M4.5 19.5 19 5m0 0h-6.4M19 5v6.4M8.8 11.9l3.3 3.3",
  // मकर — the sea-goat: the horn falling into a curled tail
  9: "M3.5 6.4c0-1.1 1-2 2.2-2s2.2.9 2.2 2v9.2M7.9 8.6c0-1.6 1.15-2.8 2.7-2.8s2.7 1.2 2.7 2.8v7.6c0 2.7 1.9 4.4 4.1 4.4 2 0 3.6-1.5 3.6-3.4 0-1.8-1.4-3.2-3.1-3.2",
  // कुम्भ — the water-bearer: two runs of water
  10: "M2.8 9.2c1.55-2.1 3.1-2.1 4.65 0s3.1 2.1 4.65 0 3.1-2.1 4.65 0 3.1 2.1 4.65 0M2.8 16c1.55-2.1 3.1-2.1 4.65 0s3.1 2.1 4.65 0 3.1-2.1 4.65 0 3.1 2.1 4.65 0",
  // मीन — the fishes: two arcs bound by a cord
  11: "M6.6 2.8c-2.6 4.3-2.6 14.1 0 18.4M17.4 2.8c2.6 4.3 2.6 14.1 0 18.4M3.4 12h17.2",
};

/** One rashi's symbol, sized by the class it is given. */
export function RashiGlyph({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={PATHS[index] ?? PATHS[0]} />
    </svg>
  );
}
