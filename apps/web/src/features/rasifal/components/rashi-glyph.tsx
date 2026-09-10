/**
 * The twelve rashi symbols, drawn.
 *
 * Not the Unicode zodiac characters: those render as whatever emoji font the
 * device happens to ship, so the set arrives in twelve different weights and
 * half of them in colour. These are one stroke weight, one visual language,
 * and they inherit `currentColor` like any other icon.
 */
const PATHS: Record<number, string> = {
  // Mesha — the ram's horns
  0: "M5 17c-1.5-3-2-6-.5-8.5C6 6 9 6 10 8.5c.7 1.8.9 4 1 8.5m0-8.5C12 6 15 6 16.5 8.5 18 11 17.5 14 16 17",
  // Vrishabha — the bull's head and horns
  1: "M12 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM4 4c0 4 3.5 7 8 7s8-3 8-7",
  // Mithuna — the twins
  2: "M5 4c4.5 1.5 9.5 1.5 14 0M5 20c4.5-1.5 9.5-1.5 14 0M9 5v14M15 5v14",
  // Karka — the crab's claws
  3: "M3 8c3-2.5 8-2.5 10 0M21 16c-3 2.5-8 2.5-10 0M5.5 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM18.5 11a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
  // Simha — the lion's mane and tail
  4: "M5 19a3.5 3.5 0 1 0 0-7c-2 0-3 1.5-3 3M5 12c0-4 1.5-7 4.5-8S15 5 14 9c-.8 3-1 5 .5 6.5 1.6 1.6 4 1 5-.5",
  // Kanya — the maiden
  5: "M4 6v11M4 8c0-1.5 1-2 2-2s2 .5 2 2v9M8 8c0-1.5 1-2 2-2s2 .5 2 2v9M12 8c0-1.5 1-2 2-2s2 .5 2 2v6c0 3 2 5 4 5.5M16 15c-1.5 2-1.5 4 0 5.5",
  // Tula — the scales
  6: "M3 18h18M3 12h7a4 4 0 0 1 8 0h3",
  // Vrishchika — the scorpion's tail
  7: "M3 6v11M3 8c0-1.5 1-2 2-2s2 .5 2 2v9M7 8c0-1.5 1-2 2-2s2 .5 2 2v9M11 8c0-1.5 1-2 2-2s2 .5 2 2v10h4l-2-2m2 2-2 2",
  // Dhanu — the archer's arrow
  8: "M5 19 19 5m0 0h-6m6 0v6M9 12l3 3",
  // Makara — the sea-goat
  9: "M4 7c0-1 1-2 2-2s2 1 2 2v8M8 9c0-1.5 1-2.5 2.5-2.5S13 8 13 9.5V16c0 2.5 2 4 4 4s3.5-1.5 3.5-3.5S19 13 17.5 13.5",
  // Kumbha — the water-bearer's waves
  10: "M3 9c1.5-2 3-2 4.5 0S10.5 11 12 9s3-2 4.5 0S19.5 11 21 9M3 16c1.5-2 3-2 4.5 0S10.5 18 12 16s3-2 4.5 0S19.5 18 21 16",
  // Meena — the two fishes
  11: "M7 3c-2.5 4-2.5 14 0 18M17 3c2.5 4 2.5 14 0 18M4 12h16",
};

/** One rashi's symbol, sized by its container's font size. */
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
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={PATHS[index] ?? PATHS[0]} />
    </svg>
  );
}
